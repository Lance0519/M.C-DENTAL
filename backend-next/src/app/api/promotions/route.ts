import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticate, requireRole } from '@/lib/auth';
import { error, success, corsOptions } from '@/lib/response';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit, getIpFromRequest } from '@/lib/audit';

// Helper function to notify all patients about new promotions
async function notifyPatientsOfNewPromotion(promoTitle: string, promoDescription: string, discount?: string) {
  try {
    const supabase = supabaseAdmin();
    
    // Get all patients from the patients table (not users table)
    const { data: patients, error: fetchErr } = await supabase
      .from('patients')
      .select('id');

    if (fetchErr) {
      console.error('Error fetching patients for promotion notification:', fetchErr);
      return;
    }

    if (!patients || patients.length === 0) {
      console.log('No patients found to notify about promotion');
      return;
    }

    console.log(`Notifying ${patients.length} patients about new promotion: ${promoTitle}`);

    const timestamp = Date.now();
    const discountText = discount ? ` - ${discount} OFF!` : '';
    const notifications = patients.map((patient, index) => ({
      id: `notif${timestamp}_${patient.id}_${index}`,
      user_id: patient.id,
      type: 'new_promotion',
      title: '🎉 New Promotion Available!',
      message: `${promoTitle}${discountText} - ${promoDescription.substring(0, 100)}${promoDescription.length > 100 ? '...' : ''}`,
      read: false,
    }));

    // Insert in batches of 100 to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error: insertErr } = await supabase.from('notifications').insert(batch);
      if (insertErr) {
        console.error('Error inserting promotion notifications batch:', insertErr);
      }
    }
    
    console.log(`Successfully created ${notifications.length} promotion notifications`);
  } catch (err) {
    console.error('Error notifying patients of new promotion:', err);
  }
}

export async function OPTIONS() {
  return corsOptions();
}

const createSchema = z.object({
  title: z.string(),
  description: z.string(),
  discount: z.string().optional(),
  originalPrice: z.string().optional(),
  promoPrice: z.string().optional(),
  validUntil: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  discount: z.string().optional(),
  originalPrice: z.string().optional(),
  promoPrice: z.string().optional(),
  validUntil: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = supabaseAdmin();
  const id = req.nextUrl.searchParams.get('id');
  const activeOnly = req.nextUrl.searchParams.get('active') === 'true';

  if (id) {
    const { data, error: dbErr } = await supabase.from('promotions').select('*').eq('id', id).single();

    if (dbErr) {
      if (dbErr.code === 'PGRST116') {
        return error('Promotion not found', 404);
      }
      return error('Failed to fetch promotion', 500);
    }

    return success(data);
  }

  let query = supabase.from('promotions').select('*');
  if (activeOnly) {
    query = query.or('valid_until.is.null,valid_until.gte.' + new Date().toISOString().slice(0, 10));
  }
  query = query.order('created_at', { ascending: false });

  const { data, error: listErr } = await query;

  if (listErr) {
    return error('Failed to fetch promotions', 500);
  }

  return success(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { title, description, discount, originalPrice, promoPrice, validUntil } = parsed.data;
  const id = `promo${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  const supabase = supabaseAdmin();
  const { error: insertErr } = await supabase.from('promotions').insert({
    id,
    title,
    description,
    discount: discount ?? null,
    original_price: originalPrice ?? null,
    promo_price: promoPrice ?? null,
    valid_until: validUntil ?? null,
  });

  if (insertErr) {
    return error('Failed to create promotion', 500);
  }

  await logAudit({
    action: 'PROMOTION_CREATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { promotionId: id, title, discount, validUntil },
    ipAddress: getIpFromRequest(req.headers),
  });

  // Notify all patients about the new promotion
  await notifyPatientsOfNewPromotion(title, description, discount);

  return success({ id }, 'Promotion created successfully');
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return error('No fields to update', 400, { issues: parsed.error.flatten() });
  }

  const id = req.nextUrl.searchParams.get('id') ?? parsed.data.id;
  if (!id) {
    return error('Promotion ID is required');
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.discount !== undefined) updates.discount = parsed.data.discount;
  if (parsed.data.originalPrice !== undefined) updates.original_price = parsed.data.originalPrice;
  if (parsed.data.promoPrice !== undefined) updates.promo_price = parsed.data.promoPrice;
  if (parsed.data.validUntil !== undefined) updates.valid_until = parsed.data.validUntil;
  if (parsed.data.active !== undefined) updates.active = parsed.data.active;

  if (Object.keys(updates).length === 0) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();

  const supabase = supabaseAdmin();
  
  // Fetch promotion details for better audit logging (including current active status)
  const { data: existingPromo } = await supabase
    .from('promotions')
    .select('title, active')
    .eq('id', id)
    .single();
  
  const { error: updateErr } = await supabase.from('promotions').update(updates).eq('id', id);

  if (updateErr) {
    return error('Failed to update promotion', 500);
  }

  // Determine if this is an activation/deactivation
  const isActivationChange = parsed.data.active !== undefined;
  const previousStatus = existingPromo?.active !== false ? 'Active' : 'Inactive';
  const newStatus = parsed.data.active ? 'Active' : 'Inactive';
  
  const actionDescription = isActivationChange
    ? `Status changed: ${previousStatus} → ${newStatus}`
    : 'Updated promotion details';

  await logAudit({
    action: 'PROMOTION_UPDATED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      promotionId: id, 
      promotionTitle: existingPromo?.title ?? 'Unknown',
      action: actionDescription,
      ...(isActivationChange && { statusChange: `${previousStatus} → ${newStatus}` }),
      updatedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Promotion updated successfully');
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin');
  if (auth instanceof Response) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return error('Promotion ID is required');
  }

  const supabase = supabaseAdmin();
  
  // Fetch promotion title before deletion for audit logging
  const { data: promoToDelete } = await supabase
    .from('promotions')
    .select('title')
    .eq('id', id)
    .single();
  
  const { error: deleteErr } = await supabase.from('promotions').delete().eq('id', id);

  if (deleteErr) {
    return error('Failed to delete promotion', 500);
  }

  await logAudit({
    action: 'PROMOTION_DELETED',
    userId: auth.id,
    userName: auth.fullName ?? 'Unknown',
    userRole: auth.role,
    details: { 
      promotionId: id, 
      promotionTitle: promoToDelete?.title ?? 'Unknown',
      action: 'Deleted promotion',
    },
    ipAddress: getIpFromRequest(req.headers),
  });

  return success(null, 'Promotion deleted successfully');
}


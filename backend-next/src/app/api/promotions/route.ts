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
  duration: z.number().optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  discount: z.union([z.string(), z.number()]).optional().nullable(),
  originalPrice: z.union([z.string(), z.number()]).optional().nullable(),
  promoPrice: z.union([z.string(), z.number()]).optional().nullable(),
  price: z.union([z.string(), z.number()]).optional().nullable(),
  validUntil: z.string().optional().nullable(),
  active: z.boolean().optional(),
  duration: z.number().optional().nullable(),
}).passthrough(); // Allow extra fields

export async function GET(req: NextRequest) {
  try {
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

    // Transform data to match frontend expectations
    const transformed = data ? {
      ...data,
      // Use discount string if available, otherwise derive from discount_percentage
      discount: data.discount || (data.discount_percentage !== null && data.discount_percentage !== undefined 
        ? `${data.discount_percentage}%` 
        : null),
      discount_percentage: data.discount_percentage,
      // Map database column names to frontend field names
      originalPrice: data.original_price,
      promoPrice: data.promo_price,
      price: data.price || data.promo_price,
      duration: data.duration ?? null,
    } : null;

    return success(transformed);
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

  // Transform data to match frontend expectations
  const transformed = (data ?? []).map((promo: any) => ({
    ...promo,
    // Use discount string if available, otherwise derive from discount_percentage
    discount: promo.discount || (promo.discount_percentage !== null && promo.discount_percentage !== undefined 
      ? `${promo.discount_percentage}%` 
      : null),
    discount_percentage: promo.discount_percentage,
    // Map database column names to frontend field names
    originalPrice: promo.original_price,
    promoPrice: promo.promo_price,
    price: promo.price || promo.promo_price,
    duration: promo.duration ?? null,
  }));

  return success(transformed);
  } catch (err) {
    console.error('GET /api/promotions - Unexpected error:', err);
    return error('Internal server error', 500, { details: err instanceof Error ? err.message : 'Unknown error' });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return error('Missing required fields', 400, { issues: parsed.error.flatten() });
  }

  const { title, description, discount, originalPrice, promoPrice, validUntil, duration } = parsed.data;
  const id = `promo${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

  // Map discount string (e.g., "30%") to discount_percentage integer
  let discountPercentage: number | null = null;
  if (discount) {
    const discountStr = discount.toString().replace('%', '').trim();
    const discountNum = parseInt(discountStr, 10);
    if (!isNaN(discountNum)) {
      discountPercentage = discountNum;
    }
  }

  const supabase = supabaseAdmin();
  const insertData: Record<string, unknown> = {
    id,
    title,
    description,
    discount: discount ?? null,
    discount_percentage: discountPercentage,
    original_price: originalPrice ?? null,
    promo_price: promoPrice ?? null,
    price: promoPrice ?? null, // Don't fallback to originalPrice - keep them independent
    valid_until: validUntil ?? null,
  };
  
  // Only include duration if it's provided (column may not exist in all schemas)
  if (duration !== undefined && duration !== null) {
    insertData.duration = duration;
  }

  let { error: insertErr } = await supabase.from('promotions').insert(insertData);

  // If insert fails due to missing duration column, retry without it
  if (insertErr && (insertErr.message?.includes('duration') || insertErr.code === '42703')) {
    console.warn('Duration column not found, retrying without duration field');
    delete insertData.duration;
    const retryResult = await supabase.from('promotions').insert(insertData);
    insertErr = retryResult.error;
  }

  if (insertErr) {
    console.error('Failed to create promotion:', insertErr);
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
  const auth = requireRole(req, 'admin', 'staff');
  if (auth instanceof Response) return auth;

  const body = await req.json();
  console.log('PUT /api/promotions - Request body:', JSON.stringify(body, null, 2));
  
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    console.error('PUT /api/promotions - Validation error:', parsed.error.flatten());
    return error('Invalid request data', 400, { issues: parsed.error.flatten() });
  }

  const id = req.nextUrl.searchParams.get('id') ?? parsed.data.id;
  if (!id) {
    return error('Promotion ID is required', 400);
  }

  console.log('PUT /api/promotions - Updating promotion:', id);

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined && parsed.data.title !== null) {
    const titleStr = String(parsed.data.title).trim();
    if (titleStr !== '') {
      updates.title = titleStr;
    }
  }
  if (parsed.data.description !== undefined && parsed.data.description !== null) {
    updates.description = String(parsed.data.description);
  }
  // Map discount string (e.g., "30%") to discount_percentage integer
  if (parsed.data.discount !== undefined) {
    // Allow null to clear the discount
    if (parsed.data.discount === null) {
      updates.discount = null;
      updates.discount_percentage = null;
    } else if (parsed.data.discount === '') {
      // Empty string also means null
      updates.discount = null;
      updates.discount_percentage = null;
    } else {
      const discountValue = String(parsed.data.discount).trim();
      updates.discount = discountValue || null;
      
      if (discountValue) {
        const discountStr = discountValue.replace('%', '').trim();
        const discountNum = parseInt(discountStr, 10);
        if (!isNaN(discountNum) && discountNum >= 0) {
          updates.discount_percentage = discountNum;
        } else {
          updates.discount_percentage = null;
        }
      } else {
        updates.discount_percentage = null;
      }
    }
  }
  // Store original_price and promo_price as strings - keep them independent
  if (parsed.data.originalPrice !== undefined) {
    // Allow null to clear the original price
    if (parsed.data.originalPrice === null || parsed.data.originalPrice === '') {
      updates.original_price = null;
    } else {
      const originalPriceStr = String(parsed.data.originalPrice).trim();
      updates.original_price = originalPriceStr || null;
    }
  }
  if (parsed.data.promoPrice !== undefined) {
    // Allow null to clear the promo price
    if (parsed.data.promoPrice === null || parsed.data.promoPrice === '') {
      updates.promo_price = null;
      updates.price = null; // Also clear price when promoPrice is null
    } else {
      const promoPriceValue = String(parsed.data.promoPrice).trim();
      updates.promo_price = promoPriceValue || null;
      // Update price field only if promoPrice is provided, don't fallback to originalPrice
      updates.price = promoPriceValue || null;
    }
  }
  if (parsed.data.price !== undefined) {
    const priceValue = parsed.data.price === null || parsed.data.price === '' 
      ? null 
      : String(parsed.data.price).trim();
    updates.price = priceValue || null;
  }
  if (parsed.data.validUntil !== undefined) {
    const validUntilStr = parsed.data.validUntil ? String(parsed.data.validUntil).trim() : '';
    updates.valid_until = validUntilStr !== '' ? validUntilStr : null;
  }
  if (parsed.data.active !== undefined) {
    updates.active = parsed.data.active;
  }
  // Handle duration - only include if provided, and handle gracefully if column doesn't exist
  // Store duration separately so we can try to update it, but skip if column doesn't exist
  let durationValue: number | null | undefined = undefined;
  let hasDurationUpdate = false;
  if (parsed.data.duration !== undefined) {
    durationValue = parsed.data.duration !== null && parsed.data.duration !== undefined 
      ? Number(parsed.data.duration) 
      : null;
    // Only add to updates if it's a valid number or explicitly null
    if (durationValue !== undefined) {
      hasDurationUpdate = true;
      // Don't add duration to updates yet - we'll try it separately
    }
  }

  if (Object.keys(updates).length === 0 && !hasDurationUpdate) {
    return error('No fields to update', 400);
  }

  updates.updated_at = new Date().toISOString();
  
  console.log('PUT /api/promotions - Updates to apply:', JSON.stringify(updates, null, 2));
  if (hasDurationUpdate) {
    console.log('PUT /api/promotions - Duration update (will try separately):', durationValue);
  }

  const supabase = supabaseAdmin();
  
  // Fetch promotion details for better audit logging (including current active status)
  const { data: existingPromo, error: fetchErr } = await supabase
    .from('promotions')
    .select('title, active')
    .eq('id', id)
    .single();
  
  if (fetchErr && fetchErr.code !== 'PGRST116') {
    console.error('Failed to fetch existing promotion:', fetchErr);
    return error(`Promotion not found: ${id}`, 404);
  }
  
  // Attempt update with all fields (without duration)
  const { data: updatedPromo, error: updateErr } = await supabase
    .from('promotions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  // If main update fails, return error
  if (updateErr) {
    console.error('Failed to update promotion - Error details:', {
      message: updateErr.message,
      details: updateErr.details,
      hint: updateErr.hint,
      code: updateErr.code,
    });
    return error(`Failed to update promotion: ${updateErr.message || 'Unknown error'}`, 500);
  }

  // If we have a duration update, try to update it separately
  // This way, if the column doesn't exist, the main update still succeeds
  if (hasDurationUpdate && durationValue !== undefined) {
    const durationUpdate = { duration: durationValue };
    const { error: durationErr } = await supabase
      .from('promotions')
      .update(durationUpdate)
      .eq('id', id);
    
    if (durationErr && (durationErr.message?.includes('duration') || durationErr.code === '42703')) {
      console.warn('Duration column not found in promotions table. Duration value will not be saved:', durationValue);
      console.warn('To enable duration support, add a "duration" column (integer, nullable) to the promotions table in Supabase');
      // Don't fail the request - the main update succeeded
    } else if (durationErr) {
      console.warn('Failed to update duration field:', durationErr.message);
      // Don't fail the request - the main update succeeded
    } else {
      console.log('Successfully updated duration:', durationValue);
    }
  }
  
  console.log('PUT /api/promotions - Successfully updated promotion:', id);

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
  const auth = requireRole(req, 'admin', 'staff');
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


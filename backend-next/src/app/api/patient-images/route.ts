import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authenticate } from '@/lib/auth';
import { logAudit, getIpFromRequest } from '@/lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to create notifications for staff when patient uploads document (excludes admin)
async function notifyStaffOfPatientUpload(patientId: string, patientName: string, imageType: string) {
  try {
    // Only notify staff, NOT admin (admin doesn't need patient-related notifications)
    const { data: staffUsers, error: fetchErr } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'staff');

    if (fetchErr) {
      console.error('Error fetching staff for patient upload notification:', fetchErr);
      return;
    }

    if (!staffUsers || staffUsers.length === 0) {
      console.log('No staff users found to notify about patient upload');
      return;
    }

    console.log(`Notifying ${staffUsers.length} staff users about patient upload from ${patientName}`);

    const timestamp = Date.now();
    const notifications = staffUsers.map((user, index) => ({
      id: `notif${timestamp}_${user.id}_${index}`,
      user_id: user.id,
      type: 'patient_document_uploaded',
      title: 'Patient Document Uploaded',
      message: `${patientName} has uploaded a new ${imageType || 'document/image'} to their profile.`,
      read: false,
    }));

    const { error: insertErr } = await supabase.from('notifications').insert(notifications);
    if (insertErr) {
      console.error('Error inserting patient upload notifications:', insertErr);
    } else {
      console.log(`Successfully created ${notifications.length} patient upload notifications`);
    }
  } catch (error) {
    console.error('Error notifying staff of patient upload:', error);
  }
}

const MAX_IMAGES_PER_PATIENT = 25;

const createSchema = z.object({
  patientId: z.string(),
  imageUrl: z.string(), // Base64 encoded image
  description: z.string().optional(),
  imageType: z.string().optional(),
  takenDate: z.string().optional(),
  uploadedBy: z.string().optional(),
});

const updateSchema = z.object({
  description: z.string().optional(),
  imageType: z.string().optional(),
  takenDate: z.string().optional(),
});

// GET - Fetch all images for a patient
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const imageId = searchParams.get('id');

    // Get single image by ID
    if (imageId) {
      const { data, error } = await supabase
        .from('patient_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
      }

      return NextResponse.json({ success: true, data });
    }

    // Get all images for a patient
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('patient_images')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('GET patient-images error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new patient image
export async function POST(req: NextRequest) {
  try {
    // Authentication - allow patients to upload their own images
    const auth = authenticate(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { patientId, imageUrl, description, imageType, takenDate, uploadedBy } = parsed.data;

    // Check if patient exists and get patient name
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    // Check image count limit
    const { count, error: countError } = await supabase
      .from('patient_images')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    if (countError) {
      return NextResponse.json({ success: false, error: 'Failed to check image count' }, { status: 500 });
    }

    if (count && count >= MAX_IMAGES_PER_PATIENT) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_IMAGES_PER_PATIENT} images allowed per patient. Please delete some images first.` },
        { status: 400 }
      );
    }

    // Insert the image
    const { data, error } = await supabase
      .from('patient_images')
      .insert({
        patient_id: patientId,
        image_url: imageUrl,
        description: description || null,
        image_type: imageType || null,
        taken_date: takenDate || null,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Log audit
    await logAudit({
      action: 'PATIENT_IMAGE_UPLOADED',
      userId: auth.id,
      userName: auth.fullName ?? 'Unknown',
      userRole: auth.role,
      details: {
        imageId: data.id,
        patientId,
        patientName: patient.full_name ?? 'Unknown',
        imageType: imageType || 'Unspecified',
        description: description || 'No description',
        uploadedBy: uploadedBy || auth.fullName || 'Unknown',
      },
      ipAddress: getIpFromRequest(req.headers),
    });

    // Notify staff/admin when a patient uploads a document
    if (auth.role === 'patient') {
      await notifyStaffOfPatientUpload(
        patientId,
        patient.full_name ?? 'Patient',
        imageType || 'document/image'
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('POST patient-images error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an existing patient image
export async function PUT(req: NextRequest) {
  try {
    // Authentication
    const auth = authenticate(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json({ success: false, error: 'Image ID is required' }, { status: 400 });
    }

    // Get existing image info for audit log
    const { data: existingImage } = await supabase
      .from('patient_images')
      .select('*, patients!inner(full_name)')
      .eq('id', imageId)
      .single();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const changedFields: string[] = [];

    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description || null;
      changedFields.push('description');
    }
    if (parsed.data.imageType !== undefined) {
      updates.image_type = parsed.data.imageType || null;
      changedFields.push('imageType');
    }
    if (parsed.data.takenDate !== undefined) {
      updates.taken_date = parsed.data.takenDate || null;
      changedFields.push('takenDate');
    }

    const { data, error } = await supabase
      .from('patient_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Log audit
    await logAudit({
      action: 'PATIENT_IMAGE_UPDATED',
      userId: auth.id,
      userName: auth.fullName ?? 'Unknown',
      userRole: auth.role,
      details: {
        imageId,
        patientId: existingImage?.patient_id,
        patientName: (existingImage?.patients as any)?.full_name ?? 'Unknown',
        updatedFields: changedFields,
        newDescription: parsed.data.description,
        newImageType: parsed.data.imageType,
      },
      ipAddress: getIpFromRequest(req.headers),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('PUT patient-images error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a patient image
export async function DELETE(req: NextRequest) {
  try {
    // Authentication
    const auth = authenticate(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json({ success: false, error: 'Image ID is required' }, { status: 400 });
    }

    // Get image info before deletion for audit log
    const { data: imageToDelete } = await supabase
      .from('patient_images')
      .select('*, patients!inner(full_name)')
      .eq('id', imageId)
      .single();

    const { error } = await supabase
      .from('patient_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Log audit
    await logAudit({
      action: 'PATIENT_IMAGE_DELETED',
      userId: auth.id,
      userName: auth.fullName ?? 'Unknown',
      userRole: auth.role,
      details: {
        imageId,
        patientId: imageToDelete?.patient_id,
        patientName: (imageToDelete?.patients as any)?.full_name ?? 'Unknown',
        imageType: imageToDelete?.image_type || 'Unspecified',
        description: imageToDelete?.description || 'No description',
      },
      ipAddress: getIpFromRequest(req.headers),
    });

    return NextResponse.json({ success: true, data: { message: 'Image deleted successfully' } });
  } catch (error) {
    console.error('DELETE patient-images error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


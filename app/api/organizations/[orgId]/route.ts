import { supabaseAdmin } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { updateOrganizationSchema, idParamSchema } from "@/lib/validation/schemas";
import { validateRequestBody, validateParams, withErrorHandling, createSuccessResponse, createErrorResponse } from "@/lib/validation/utils";

// GET /api/organizations/:orgId
export const GET = withErrorHandling(async (
  _req: Request,
  { params }: { params: { orgId: string } }
) => {
  const { userId } = await auth();
  if (!userId) {
    return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate parameters
  const paramValidation = validateParams(params, idParamSchema.shape.id);
  if (!paramValidation.success) {
    return paramValidation.response;
  }

  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("id", params.orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse("NOT_FOUND", "Organization not found", 404);
    }
    throw error;
  }

  return createSuccessResponse(org);
});

// PUT /api/organizations/:orgId
export const PUT = withErrorHandling(async (
  req: Request,
  { params }: { params: { orgId: string } }
) => {
  const { userId } = await auth();
  if (!userId) {
    return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate parameters
  const paramValidation = validateParams(params, idParamSchema.shape.id);
  if (!paramValidation.success) {
    return paramValidation.response;
  }

  // Validate request body
  const validation = await validateRequestBody(req, updateOrganizationSchema);
  if (!validation.success) {
    return validation.response;
  }

  const updates = validation.data;
  
  // Check if organization exists and user has permission
  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("owner_id")
    .eq("id", params.orgId)
    .single();

  if (orgError) {
    if (orgError.code === 'PGRST116') {
      return createErrorResponse("NOT_FOUND", "Organization not found", 404);
    }
    throw orgError;
  }

  if (org.owner_id !== userId) {
    return createErrorResponse("FORBIDDEN", "You don't have permission to update this organization", 403);
  }

  // Update organization
  const { data, error } = await supabaseAdmin
    .from("organizations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", params.orgId)
    .select()
    .single();

  if (error) throw error;

  return createSuccessResponse(data, 200, "Organization updated successfully");
});

// DELETE /api/organizations/:orgId
export const DELETE = withErrorHandling(async (
  _req: Request,
  { params }: { params: { orgId: string } }
) => {
  const { userId } = await auth();
  if (!userId) {
    return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate parameters
  const paramValidation = validateParams(params, idParamSchema.shape.id);
  if (!paramValidation.success) {
    return paramValidation.response;
  }

  // Check if organization exists and user has permission
  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("owner_id")
    .eq("id", params.orgId)
    .single();

  if (orgError) {
    if (orgError.code === 'PGRST116') {
      return createErrorResponse("NOT_FOUND", "Organization not found", 404);
    }
    throw orgError;
  }

  if (org.owner_id !== userId) {
    return createErrorResponse("FORBIDDEN", "You don't have permission to delete this organization", 403);
  }

  // Delete organization
  const { error } = await supabaseAdmin
    .from("organizations")
    .delete()
    .eq("id", params.orgId);

  if (error) throw error;

  return createSuccessResponse(null, 200, "Organization deleted successfully");
});

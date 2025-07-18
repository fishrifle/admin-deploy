import { supabaseAdmin } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { createOrganizationSchema, paginationSchema, sortSchema } from "@/lib/validation/schemas";
import { validateRequestBody, validateQuery, withErrorHandling, createSuccessResponse, createErrorResponse } from "@/lib/validation/utils";

export const GET = withErrorHandling(async (req: Request) => {
  const user = await currentUser();
  if (!user?.id) {
    return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
  }
  const userId = user.id;

  // Validate query parameters
  const url = new URL(req.url);
  const queryValidation = validateQuery(url.searchParams, paginationSchema.merge(sortSchema));
  if (!queryValidation.success) {
    return queryValidation.response;
  }

  const { page, limit, sortBy, sortOrder } = queryValidation.data;
  const supabase = supabaseAdmin;

  // Check if user is super admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userData?.role !== "super_admin") {
    return createErrorResponse("FORBIDDEN", "Super admin access required", 403);
  }

  // Fetch organizations with pagination
  const offset = ((page || 1) - 1) * (limit || 10);
  let query = supabase
    .from("organizations")
    .select("*", { count: "exact" })
    .range(offset, offset + (limit || 10) - 1);

  if (sortBy && sortBy === "name") {
    query = query.order("name", { ascending: sortOrder === "asc" });
  } else {
    query = query.order("created_at", { ascending: sortOrder === "asc" });
  }

  const { data: organizations, error, count } = await query;

  if (error) throw error;

  return createSuccessResponse({
    organizations,
    pagination: {
      page: page || 1,
      limit: limit || 10,
      total: count || 0,
      pages: Math.ceil((count || 0) / (limit || 10)),
    },
  });
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await currentUser();
  if (!user?.id) {
    return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // Validate request body
  const validation = await validateRequestBody(req, createOrganizationSchema);
  if (!validation.success) {
    return validation.response;
  }

  const { name, email, description, website, phone, address, logo_url } = validation.data;
  const supabase = supabaseAdmin;

  // Insert organization
  const { data, error } = await supabase
    .from("organizations")
    .insert({ 
      name, 
      email, 
      description, 
      website, 
      phone, 
      address, 
      logo_url,
    })
    .select()
    .single();

  if (error) throw error;

  return createSuccessResponse(data, 201, "Organization created successfully");
});

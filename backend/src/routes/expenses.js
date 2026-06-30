import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const expensesRoutes =
new Elysia({
  prefix: "/expenses"
})

.get("/",
async ({ set }) =>
{
  const {
    data,
    error
  } = await supabase
    .from("expenses")
.select("*")
.eq(
  "is_archived",
  false
)
.order(
  "expense_date",
  {
    ascending: false
  });

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    expenses: data || []
  };
})

.post("/",
async ({ body, set }) =>
{
  const {
    data,
    error
  } = await supabase
    .from("expenses")
    .insert([body])
    .select()
    .single();

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    expense: data
  };
})

.patch("/:id",
async ({ params, body, set }) =>
{
  const {
    error
  } = await supabase
    .from("expenses")
    .update(body)
    .eq(
      "id",
      params.id
    );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true
  };
})

.patch(
  "/:id/archive",
  async ({
    params,
    set
  }) =>
{
  const {
    error
  } =
    await supabase
      .from("expenses")
      .update({
        is_archived: true
      })
      .eq(
        "id",
        params.id
      );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }

  return {
    success: true
  };
})

.patch(
  "/:id/restore",
  async ({
    params,
    set
  }) =>
{
  const {
    error
  } =
    await supabase
      .from("expenses")
      .update({
        is_archived: false
      })
      .eq(
        "id",
        params.id
      );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message:
        error.message
    };
  }

  return {
    success: true
  };
})

.delete("/:id",
async ({ params, set }) =>
{
  const {
    error
  } = await supabase
    .from("expenses")
    .delete()
    .eq(
      "id",
      params.id
    );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true
  };
});
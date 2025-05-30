"use server";
import { z } from "zod";
import { sql } from "./db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (prevState: any, formData: FormData) => {
  const parsed = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { message: "Validation failed" };
  }
  const { amount, customerId, status } = parsed.data;
  const amountInCents = amount * 100;
  const isoDate = new Date().toISOString().split("T")[0];
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${isoDate})
      `;
    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.log(`Exception while updating db: ${error}`);
    return { message: "Db failed" };
  } finally {
    redirect("/dashboard/invoices");
  }
};

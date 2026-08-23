import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((val) => (val === "" ? undefined : val));

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Invalid calendar date");

export const reportSchema = z.object({
  type: z.enum(["LOST", "FOUND"]),
  
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title is too long"),
    
  category: z.string()
    .trim()
    .min(2, "Category is required")
    .max(50, "Category is too long"),
    
  description: optionalText(1000),
  color: optionalText(50),
    
  location: z.string()
    .trim()
    .min(2, "Location is required")
    .max(100, "Location is too long"),

  contactEmail: z.string().trim().email("Please enter a valid email address"),
  imageUrl: optionalText(500),

  eventDate: dateStringSchema
});

export type ReportInput = z.infer<typeof reportSchema>;

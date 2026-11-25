import type { FieldErrors } from "./validation";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialFormState: FormState = { status: "idle" };

export const NOT_CONNECTED_MESSAGE =
  "Thanks! This form is ready, but the website's database isn't connected yet, so nothing was saved. (Site owner: follow README → Step 2 to connect Supabase.)";

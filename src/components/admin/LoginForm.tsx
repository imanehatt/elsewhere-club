"use client";

import { useActionState } from "react";
import { login, type AdminState } from "@/app/admin/actions";
import { Notice, Submit } from "./ui";

export function LoginForm() {
  const [state, action] = useActionState<AdminState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <Notice state={state} />
      <Submit className="w-full py-3.5">Sign in</Submit>
    </form>
  );
}

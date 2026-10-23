import { expect, test } from "@playwright/test";

test("member can request a password recovery email", async ({ page }) => {
  let recoveryRequest: { email: string; redirectTo: string | null } | undefined;
  await page.route("**/auth/v1/recover*", async (route) => {
    const body = route.request().postDataJSON() as {
      email: string;
    };
    recoveryRequest = {
      email: body.email,
      redirectTo: new URL(route.request().url()).searchParams.get(
        "redirect_to",
      ),
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Lupa kata sandi?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("member@example.com");
  await page.getByRole("button", { name: "Kirim tautan reset" }).click();

  await expect(
    page.getByText(/Jika alamat tersebut terdaftar, tautan reset akan dikirim/),
  ).toBeVisible();
  expect(recoveryRequest).toEqual({
    email: "member@example.com",
    redirectTo: "http://127.0.0.1:3000/auth/callback?authAction=recovery",
  });
});

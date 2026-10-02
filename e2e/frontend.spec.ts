import { test, expect } from "@playwright/test";

test("halaman Auth Supabase tampil dan responsif", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Meeting selesai/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lanjut dengan Google" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Kata sandi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Belum punya akun? Daftar" }).click();
  await expect(page.getByLabel("Nama", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buat akun" })).toBeVisible();
  await page.screenshot({
    path: `.impeccable/review/${testInfo.project.name}-auth.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

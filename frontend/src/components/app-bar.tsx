import { ThemeSwitcher } from "./theme-switcher";

export function AppBar() {
  return (
    <div className="fied shadow-base inset-x-0 top-0 z-50 flex h-12 w-full items-center justify-between bg-gray-100 px-4 dark:bg-neutral-700">
      <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-100">
        Chat App
      </h3>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
      </div>
    </div>
  );
}

import { ThemeSwitcher } from "./theme-switcher";

export function AppBar() {
  return (
    <div className="fied inset-x-0 top-0 z-50 flex w-full items-center justify-between bg-gray-100 px-4 py-2 dark:bg-neutral-700">
      <h3>Chat Now</h3>
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
      </div>
    </div>
  );
}

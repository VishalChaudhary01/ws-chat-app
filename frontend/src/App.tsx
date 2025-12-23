export default function App() {
  const handleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  return (
    <div className="w-full max-w-[1440px] min-h-screen mx-auto">
      <div className="flex flex-col items-center py-16 gap-2">
        <h2 className="text-2xl font-bold">Hi there</h2>
        <button
          onClick={handleTheme}
          className="border cursor-pointer px-3 py-1.5 rounded-lg font-medium"
        >
          Change Theme
        </button>
      </div>
    </div>
  );
}

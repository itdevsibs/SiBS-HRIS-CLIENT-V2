import { useRouter } from "@/lib/router";


export default function Logo({ showText = true, size = 40 }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push("/")}
      className="flex items-center gap-2 cursor-pointer select-none"
    >
      {/* Logo Image */}
      <img
        src="/logo.png" // 👉 put your logo in /public/logo.png
        alt="SiBS HRIS Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />

      {/* Text */}
      {showText && (
        <div className="leading-tight">
          <p className="text-lg font-bold tracking-tight">
            SiBS
          </p>
          <p className="text-xs text-gray-500 -mt-1">
            HRIS
          </p>
        </div>
      )}
    </div>
  );
}
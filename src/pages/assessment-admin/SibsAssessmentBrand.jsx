import { motion as framerMotion } from "framer-motion";
const MotionDiv = framerMotion.div;
const MotionSpan = framerMotion.span;

export default function SibsAssessmentBrand({ collapsed = false, isMobile = false }) {
  const showText = !collapsed || isMobile;

  return (
    <div className="flex min-w-0 select-none items-center">
      <MotionDiv
        whileHover={{ rotate: -3, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] shadow-[0_8px_20px_rgba(0,25,55,0.25)] 2xl:h-11 2xl:w-11 2xl:rounded-[15px]"
      >
        <img
          src="/sibs-hris-icon-192.png"
          alt="SiBS HRIS logo"
          width={44}
          height={44}
          draggable={false}
          className="block h-full w-full rounded-[13px] object-contain 2xl:rounded-[15px]"
        />
        {/* Ticketing-style floating accent: small, anchored to the icon's upper right.
            Follow the existing 6s SiBS white/orange wordmark color cycle. */}
        <MotionSpan
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full border-2 border-sibs-primary-1 2xl:h-3.5 2xl:w-3.5"
          animate={{
            // Subtle clockwise floating motion, staying above the icon.
            x: [0, 2, 0, -2, 0],
            y: [-1, 0, 1, 0, -1],
            scale: [1, 1.06, 1.1, 1.06, 1],
            backgroundColor: [
              "rgb(255, 255, 255)",
              "rgb(255, 175, 133)",
              "var(--color-sibs-orange)",
              "rgb(255, 175, 133)",
              "rgb(255, 255, 255)",
            ],
            boxShadow: [
              "0 0 5px rgba(255,255,255,0.45)",
              "0 0 7px rgba(255,175,133,0.55)",
              "0 0 9px rgba(255,110,48,0.65)",
              "0 0 7px rgba(255,175,133,0.55)",
              "0 0 5px rgba(255,255,255,0.45)",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
        />
      </MotionDiv>

      <div
        className={`min-w-0 leading-none overflow-hidden whitespace-nowrap transition-all duration-300 ${
          showText
            ? "max-w-[150px] 2xl:max-w-[170px] opacity-100 ml-2.5"
            : "max-w-0 opacity-0 pointer-events-none ml-0"
        }`}
      >
        <div className="flex min-w-0 items-baseline whitespace-nowrap">
          <MotionSpan
            className="text-[18px] 2xl:text-[20px] font-bold tracking-[-0.035em]"
            animate={{
              color: [
                "rgb(255, 255, 255)",
                "var(--color-sibs-orange)",
                "rgb(255, 255, 255)",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.5, 1],
            }}
          >
            SiBS&nbsp;
          </MotionSpan>

          <MotionSpan
            className="text-[18px] 2xl:text-[20px] font-bold tracking-[-0.035em]"
            animate={{
              color: [
                "var(--color-sibs-orange)",
                "rgb(255, 255, 255)",
                "var(--color-sibs-orange)",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.5, 1],
            }}
          >
            HRIS
          </MotionSpan>
        </div>

        <p className="mt-0.5 text-[7.5px] 2xl:text-[8.5px] font-semibold uppercase tracking-[0.08em] 2xl:tracking-[0.1em] text-slate-300/80">
          Human Resource System
        </p>
      </div>
    </div>
  );
}


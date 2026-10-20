import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { getChatAttachmentPreview } from "@/lib/axios/sibsChat";
import { makeChatHeicJpeg } from "@/lib/utils/chat/chatHeicPreview";

/** Decodes a HEIC image on demand while preserving the original for Download. */
export default function ChatHeicThumbnail({ attachmentId, file, alt = "HEIC image", className = "" }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let temporaryUrl = "";
    const controller = new AbortController();
    setPreviewUrl("");
    setFailed(false);
    async function loadPreview() {
      try {
        const blob = file || await getChatAttachmentPreview(attachmentId, controller.signal, { original: true });
        if (!mounted) return;
        const converted = await makeChatHeicJpeg(blob);
        if (!mounted) return;
        temporaryUrl = URL.createObjectURL(converted);
        setPreviewUrl(temporaryUrl);
      } catch {
        if (mounted && !controller.signal.aborted) setFailed(true);
      }
    }
    void loadPreview();
    return () => {
      mounted = false;
      controller.abort();
      if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    };
  }, [attachmentId, file]);

  if (previewUrl) return <img src={previewUrl} alt={alt} className={className} />;
  return (
    <span className="flex h-full min-h-12 w-full flex-col items-center justify-center gap-1 bg-sibs-canvas px-2 text-center text-[10px] font-bold text-sibs-navy">
      {failed ? <ImageIcon size={18} className="text-sibs-orange" /> : <Loader2 size={18} className="animate-spin text-sibs-orange" />}
      {failed ? "HEIC image · View or download" : "Preparing HEIC preview…"}
    </span>
  );
}

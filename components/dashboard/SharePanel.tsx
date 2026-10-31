"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { FaWhatsapp } from "react-icons/fa";
import { CopyButton } from "@/components/dashboard/CopyButton";

export function SharePanel({ url, message, slug }: { url: string; message: string; slug: string }) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 600 }).then(setQr).catch(() => setQr(null));
  }, [url]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-navy-600">Your link</p>
        <p className="font-mono text-sm break-all text-navy-900">{url}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={url} />
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 px-4 items-center gap-2 rounded-btn bg-[#25D366] text-white text-sm font-semibold">
            <FaWhatsapp className="w-4 h-4" /> Send on WhatsApp
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 px-4 items-center rounded-btn border text-sm font-semibold">Open page</a>
        </div>
      </div>
      <div className="bg-white rounded-card border border-[#E4DED2] p-5 flex flex-col sm:flex-row items-center gap-5">
        {qr ? <img src={qr} alt={`QR code for ${url}`} width={180} height={180} className="rounded border" /> : <div className="w-[180px] h-[180px] bg-navy-50 rounded" />}
        <div className="space-y-2 text-sm text-navy-800">
          <p className="font-semibold">QR code</p>
          <p>Clients scan it with their phone camera to open your page.</p>
          {qr && (
            <a href={qr} download={`${slug}-qr.png`} className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-semibold">Download QR</a>
          )}
        </div>
      </div>
    </div>
  );
}

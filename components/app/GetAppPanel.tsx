"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ShieldAlert } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { APK_URL } from "@/lib/app-install";
import { useAppOffer } from "@/components/app/useAppOffer";

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3 text-sm text-navy-900">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-6 h-6 shrink-0 rounded-full bg-navy-900 text-gold-500 text-xs font-bold inline-flex items-center justify-center" aria-hidden>{i + 1}</span>
          <span className="min-w-0 pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-4">
      <h2 className="font-bold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

const CHROME_STEPS = [
  <>Chrome-la {BRAND.name} open pannunga, sign in pannunga.</>,
  <>Mela right side <b>⋮</b> (moonu pulli) tap pannunga.</>,
  <><b>&quot;Add to Home screen&quot;</b> illa <b>&quot;Install app&quot;</b> tap pannunga.</>,
];

function ApkInstall() {
  const fileName = APK_URL.split("/").pop();
  return (
    <>
      <Card title="Android phone-ku">
        <a href={APK_URL} download className="h-12 px-6 rounded-btn bg-navy-900 text-gold-500 font-bold inline-flex items-center gap-2">
          <Download className="w-5 h-5" aria-hidden /> Download app
        </a>
        <Steps
          items={[
            <><b>&quot;Download app&quot;</b> tap pannunga. {fileName} download aagum (5 MB-kku keezha).</>,
            <>Chrome &quot;file harm pannalaam&quot; nu warning kaattinaa, <b>&quot;Download anyway&quot;</b> tap pannunga. Indha file namma website-la irundhu dhaan varudhu.</>,
            <>Download mudinjadhum mela varra <b>&quot;Open&quot;</b> tap pannunga (illa Files → Downloads-la {BRAND.name} tap pannunga).</>,
            <>&quot;Permission required&quot; illa &quot;Install unknown apps&quot; nu vandhaa, <b>Settings</b> → <b>&quot;Allow from this source&quot;</b> ON pannunga. Back vandhu <b>Install</b> tap pannunga.</>,
            <>Play Protect &quot;App scan recommended&quot; illa &quot;Unsafe app&quot; nu vandhaa, <b>&quot;More details&quot;</b> tap pannunga, apram <b>&quot;Install&quot;</b> illa <b>&quot;Install anyway&quot;</b> tap pannunga. &quot;Scan app&quot; pannalaam, adhuvum OK.</>,
            <><b>Open</b> tap pannunga. Chrome-la already login panniyirundhaa, login apdiye irukkum.</>,
          ]}
        />
        <p className="text-sm text-navy-800">
          Samsung phone-la &quot;Auto Blocker&quot; ON-la irundhaa install aagaadhu: Settings → Security and privacy → Auto Blocker → OFF. Install aanadhum thirumba ON pannalaam.
        </p>
        <p className="rounded-card border border-gold-300 bg-gold-50 p-3 text-sm text-navy-900 flex gap-2">
          <ShieldAlert className="w-5 h-5 text-gold-700 shrink-0" aria-hidden />
          <span>{BRAND.name} app-ah <b>indha website-la irundhu mattum</b> download pannunga. WhatsApp-la yaaravadhu APK file anuppinaa install pannaadheenga.</span>
        </p>
      </Card>
      <Card title="Warning illaama podanum-na">
        <p className="text-sm text-navy-800">Chrome-laye {BRAND.name}-ah phone-la vaikkalaam. Rendu vazhi-yum idhe website dhaan, adhe login. Onnu pothum, rendum vendaam.</p>
        <Steps items={CHROME_STEPS} />
      </Card>
    </>
  );
}

function ScanOnPhone() {
  const [qr, setQr] = useState<string | null>(null);
  const [address, setAddress] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/app`;
    setAddress(url.replace(/^https?:\/\//, ""));
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(url, { margin: 1, width: 220 })).then(setQr).catch(() => setQr(null));
  }, []);

  return (
    <Card title="Phone-la open pannunga">
      <div className="flex flex-wrap items-center gap-4">
        {qr && <img src={qr} alt={`QR code for ${address}`} width={150} height={150} className="rounded border bg-white" />}
        <p className="text-sm text-navy-900 min-w-0 flex-1 basis-56">
          Phone camera-la indha QR scan pannunga, illa phone-la <span className="font-mono break-all">{address}</span> open pannunga. Android-ku app, iPhone-ku Home Screen steps anga kaattum.
        </p>
      </div>
    </Card>
  );
}

/** The install steps for this device. Empty until mounted: only the browser knows the phone. */
export function GetAppPanel() {
  const offer = useAppOffer();

  return (
    <div className="space-y-5 min-h-64">
      {offer === "apk" && <ApkInstall />}
      {offer === "android-chrome" && (
        <Card title="Android phone-ku">
          <Steps items={CHROME_STEPS} />
        </Card>
      )}
      {offer === "iphone" && (
        <Card title="iPhone-ku">
          <Steps
            items={[
              <>Safari-la {BRAND.name} open pannunga.</>,
              <>Keezha <b>Share</b> button (box-la mela arrow) tap pannunga.</>,
              <><b>&quot;Add to Home Screen&quot;</b> tap pannunga.</>,
            ]}
          />
        </Card>
      )}
      {offer === "desktop" && <ScanOnPhone />}
      {offer === "installed" && (
        <Card title={`${BRAND.name} app already irukku`}>
          <p className="text-sm text-navy-800">Neenga ready. Vera edhuvum panna vendaam.</p>
          <Link href="/dashboard" className="h-11 px-5 rounded-btn bg-navy-900 text-gold-500 font-bold inline-flex items-center">Dashboard open pannunga</Link>
        </Card>
      )}
    </div>
  );
}

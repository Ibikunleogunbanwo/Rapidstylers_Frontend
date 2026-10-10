import Back from "../../../components/goBack";
import { SUPPORT_EMAIL } from "../../../utils/constant";

export default function ProfileUpdateNotice({ title }) {
  return <div className="rounded-md border">
    <div className="flex items-center gap-3 border-b p-4 text-sm font-medium"><Back /><h1>{title}</h1></div>
    <div className="p-4 text-sm space-y-3">
      <p>Profile changes currently require support. Send your requested changes so we can review and update your profile.</p>
      <a className="inline-block text-brand underline" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(title)}`}>Contact support</a>
    </div>
  </div>;
}

import { useEffect, useRef, useState } from "react";
import Back from "../../components/goBack";
import Button from "../../components/button";
import { APIService } from "../../hooks/remote/apiService";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
import { showSuccessToastMessage } from "../../utils/constant";

/**
 * The professional replacing their own profile and/or cover photo.
 *
 * The upload goes straight to Cloudinary through a signature the backend issues
 * for this account, so the file lands in the professional's own folder and the
 * save call can prove the photo is theirs. Both slots are optional and only the
 * one chosen is replaced; the photo it replaces is deleted server-side once
 * nothing else points at it.
 */
const UpdateCoverPhoto = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Object URLs for the just-chosen files, revoked before the next set so the
  // page does not hold the image data after it is no longer shown.
  const previews = useRef({ profile: "", cover: "" });

  const load = () => {
    setLoading(true);
    setLoadError("");
    return APIService.getStylerOwnProfile()
      .then((response) => {
        const data = response.data?.data;
        if (!data || typeof data !== "object") throw new Error("Invalid response");
        setProfile(data);
      })
      .catch(() => setLoadError("Could not load your profile."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = "Update photos | RapidStylers";
    load();
    return () => {
      Object.values(previews.current).forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, []);

  const chooseFile = (slot, setFile) => (event) => {
    const file = event.target.files?.[0] || null;
    if (previews.current[slot]) URL.revokeObjectURL(previews.current[slot]);
    previews.current[slot] = file ? URL.createObjectURL(file) : "";
    setFile(file);
    setSaveError("");
  };

  const save = async () => {
    if (saving) return;
    if (!profileFile && !coverFile) {
      setSaveError("Choose a photo to upload first.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {};
      if (profileFile) payload.profileImageUrl = (await uploadToCloudinary(profileFile, "profile")).url;
      if (coverFile) payload.coverImageUrl = (await uploadToCloudinary(coverFile, "cover")).url;
      const response = await APIService.updateStylerPhotos(payload);
      if (response.data?.statusCode === "200") {
        setProfile(response.data.data || profile);
        setProfileFile(null);
        setCoverFile(null);
        Object.values(previews.current).forEach((url) => url && URL.revokeObjectURL(url));
        previews.current = { profile: "", cover: "" };
        showSuccessToastMessage(response.data?.message || "Photos saved");
      } else {
        setSaveError(response.data?.message || "Could not save your photos.");
      }
    } catch (error) {
      setSaveError(
        error?.code === "UPLOAD_AUTHORIZATION"
          ? "Photo uploads are temporarily unavailable. Please try again later or contact support."
          : "Could not save your photos. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const slots = [
    { slot: "profile", label: "Profile photo", current: profile?.profileImageUrl, file: profileFile, onChoose: chooseFile("profile", setProfileFile) },
    { slot: "cover", label: "Cover photo", current: profile?.coverImageUrl, file: coverFile, onChoose: chooseFile("cover", setCoverFile) },
  ];

  return (
    <div className="rounded-lg border border-black/10">
      <div className="flex items-center gap-3 border-b border-black/10 p-4 text-[11px] uppercase tracking-[0.25em] text-muted">
        <Back />
        <span>Update photos</span>
      </div>
      <div className="p-4">
        {loading ? (
          <p role="status" className="text-sm text-black/50">Loading your profile...</p>
        ) : loadError ? (
          <div role="alert" className="text-sm text-red-600">
            {loadError}{" "}
            <button type="button" className="text-brand underline" onClick={load}>
              Retry
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              {slots.map((item) => (
                <div key={item.slot}>
                  <p className="text-sm font-medium">{item.label}</p>
                  <div className="mt-2 overflow-hidden rounded-lg border border-black/10 bg-black/[0.03]">
                    {(previews.current[item.slot] || item.current) ? (
                      <img
                        src={previews.current[item.slot] || item.current}
                        alt={`${item.label} preview`}
                        className={`w-full object-cover ${item.slot === "cover" ? "h-32" : "h-48"}`}
                      />
                    ) : (
                      <div className={`flex items-center justify-center text-xs text-black/40 ${item.slot === "cover" ? "h-32" : "h-48"}`}>
                        No photo yet
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={`Choose ${item.label.toLowerCase()}`}
                    onChange={item.onChoose}
                    className="mt-2 block text-sm text-black/60"
                  />
                  {item.file && <p className="mt-1 text-xs text-black/50">Selected: {item.file.name}</p>}
                </div>
              ))}
            </div>

            {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}

            <div>
              <Button text={saving ? "Saving..." : "Save photos"} variant="primary" type="button" onClick={save} disabled={saving} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateCoverPhoto;

// Round user picture: the photo if one was chosen, otherwise the first letter of the name.
// With `editable`, tapping it opens the phone's photo picker.
import { useRef, useState } from 'react';
import { setProfilePhoto, type Profile } from '../db/profiles';

/** Shrink and crop the picked image to a 256×256 JPEG, so it's small enough to store. */
async function toSquareJpeg(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.getContext('2d')!.drawImage(
    bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size,
  );
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function Avatar(props: { profile: Profile; size?: number; editable?: boolean }) {
  const { profile, size = 40, editable } = props;
  const [photo, setPhoto] = useState(profile.photo);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const data = await toSquareJpeg(file);
    setProfilePhoto(profile.id, data);
    setPhoto(data);
  }

  const style = { width: size, height: size, fontSize: size * 0.45 };
  const face = photo
    ? <img src={photo} alt="" className="avatar" style={style} />
    : <span className="avatar" style={style}>{profile.name.charAt(0).toUpperCase()}</span>;

  if (!editable) return face;
  return (
    <>
      <button className="avatar-btn" aria-label="Change profile picture" onClick={() => input.current?.click()}>
        {face}
        <span className="avatar-edit">✎</span>
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0])} />
    </>
  );
}

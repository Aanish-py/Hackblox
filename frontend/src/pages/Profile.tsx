import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { User, Edit2, Save, X, Link, Code, Briefcase, Star } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import api from "../lib/api";
import { shortenAddress } from "../lib/types";

interface Profile {
  address: string;
  displayName: string;
  bio: string;
  skills: string[];
  portfolioLinks: string[];
  avatarUrl: string;
}

export default function ProfilePage() {
  const { address: paramAddr } = useParams<{ address?: string }>();
  const { address: myAddr } = useWallet();
  const target = paramAddr || myAddr;
  const isOwn = target?.toLowerCase() === myAddr?.toLowerCase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    api.get(`/profile/${target}`)
      .then((r) => {
        setProfile(r.data);
        setForm(r.data);
      })
      .catch(() => {
        const empty: Profile = {
          address: target,
          displayName: "",
          bio: "",
          skills: [],
          portfolioLinks: [],
          avatarUrl: "",
        };
        setProfile(empty);
        setForm(empty);
      })
      .finally(() => setLoading(false));
  }, [target]);

  const handleSave = async () => {
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/profile/${target}`, form);
      setProfile(res.data);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    setForm((f) => ({ ...f, skills: [...(f.skills || []), skill.trim()] }));
  };

  const removeSkill = (i: number) => {
    setForm((f) => ({ ...f, skills: f.skills?.filter((_, idx) => idx !== i) }));
  };

  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center text-slate-400">Connect wallet to view profile.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-64 h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 page-enter">
      <div className="max-w-2xl mx-auto">
        {/* Profile header */}
        <div className="glass-card p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, #7c3aed, #06b6d4)` }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="avatar" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  value={form.displayName || ""}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Your name or alias"
                  className="input-field text-lg font-bold mb-2"
                  id="profile-name-input"
                />
              ) : (
                <h1 className="heading-md mb-1">
                  {profile?.displayName || shortenAddress(target)}
                </h1>
              )}
              <p className="font-mono text-sm text-brand-300">{target}</p>
            </div>
            {isOwn && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving} id="save-profile-btn" className="btn-success text-sm py-2 px-4">
                      <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-2 px-3">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} id="edit-profile-btn" className="btn-secondary text-sm py-2 px-4">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="glass-card p-6 mb-5">
          <h2 className="heading-md mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-400" /> Bio
          </h2>
          {editing ? (
            <textarea
              value={form.bio || ""}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell clients about yourself, your expertise, and what you build..."
              rows={4}
              className="input-field resize-none"
              id="profile-bio-input"
            />
          ) : (
            <p className="text-slate-400 text-sm leading-relaxed">
              {profile?.bio || <span className="text-slate-600 italic">No bio yet.</span>}
            </p>
          )}
        </div>

        {/* Skills */}
        <div className="glass-card p-6 mb-5">
          <h2 className="heading-md mb-3 flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" /> Skills
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {(editing ? form.skills : profile?.skills)?.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-brand-600/20 text-brand-300 border border-brand-600/30 text-sm"
              >
                {s}
                {editing && (
                  <button onClick={() => removeSkill(i)} className="ml-1 text-brand-500 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <input
              placeholder="Type a skill and press Enter..."
              className="input-field text-sm"
              id="add-skill-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          )}
        </div>

        {/* Portfolio links */}
        <div className="glass-card p-6 mb-5">
          <h2 className="heading-md mb-3 flex items-center gap-2">
            <Link className="w-4 h-4 text-green-400" /> Portfolio Links
          </h2>
          {editing ? (
            <textarea
              value={(form.portfolioLinks || []).join("\n")}
              onChange={(e) =>
                setForm((f) => ({ ...f, portfolioLinks: e.target.value.split("\n").filter(Boolean) }))
              }
              placeholder="https://github.com/your-profile&#10;https://your-portfolio.com"
              rows={3}
              className="input-field resize-none text-sm"
              id="portfolio-links-input"
            />
          ) : (
            <div className="space-y-2">
              {profile?.portfolioLinks?.length ? (
                profile.portfolioLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm transition-colors"
                  >
                    <Link className="w-3 h-3" /> {link}
                  </a>
                ))
              ) : (
                <p className="text-slate-600 italic text-sm">No portfolio links.</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}

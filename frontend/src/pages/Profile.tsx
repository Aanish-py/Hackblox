import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { User, Edit2, Save, X, ExternalLink, Code, Briefcase, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import DashboardShell from "../components/DashboardShell";
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
    api
      .get(`/profile/${target}`)
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
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-12 text-center max-w-md mx-auto my-12 shadow-xs">
          <User className="w-10 h-10 text-[#8A93A3] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#172033] mb-1">Connect Wallet to View Profile</h2>
          <p className="text-xs text-[#5F6878]">Please connect your Web3 wallet or navigate to a public address.</p>
        </div>
      </DashboardShell>
    );
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-8 shadow-xs flex items-center gap-6">
            <div className="w-20 h-20 bg-[#F1F2FA] rounded-2xl animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-[#F1F2FA] rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-[#F1F2FA] rounded w-1/2 animate-pulse" />
            </div>
          </div>
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 h-32 animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  const isProfileEmpty =
    !profile?.displayName && !profile?.bio && (!profile?.skills || profile.skills.length === 0);

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Identity Card */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar / Monogram */}
            <div className="w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center bg-[#E8F5EE] border border-[#23895A]/30 text-[#176B4A]">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="avatar" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6878] mb-1">
                      Display Name / Professional Alias
                    </label>
                    <input
                      value={form.displayName || ""}
                      onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                      placeholder="e.g. Satoshi Nakamoto"
                      className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg px-3.5 py-2 text-sm font-semibold text-[#172033] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors"
                      id="profile-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6878] mb-1">
                      Avatar URL (Optional)
                    </label>
                    <input
                      value={form.avatarUrl || ""}
                      onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                    {profile?.displayName || (
                      <span className="text-[#8A93A3] font-normal text-lg">No display name set</span>
                    )}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs text-[#5F6878] bg-[#F1F2FA] px-2.5 py-1 rounded-md">
                      {target}
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${target}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8A93A3] hover:text-[#176B4A] transition-colors p-1"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isOwn && (
              <div className="flex gap-2 self-start">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      id="save-profile-btn"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? "Saving..." : "Save"}</span>
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="p-2 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE] text-[#5F6878] hover:text-[#172033] transition-colors"
                      aria-label="Cancel editing"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    id="edit-profile-btn"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E2E4EE] text-xs font-semibold text-[#172033] hover:bg-[#F1F2FA] transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#5F6878]" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Setup Notice for empty own profile */}
        {isOwn && isProfileEmpty && !editing && (
          <div className="bg-[#E8F5EE] border border-[#23895A]/30 rounded-xl p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#176B4A] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#176B4A]">Complete your freelancer identity</p>
                <p className="text-xs text-[#23895A] mt-0.5">
                  Adding your skills, bio, and portfolio links makes you stand out to clients posting escrow gigs.
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg bg-[#176B4A] text-white text-xs font-semibold shrink-0 hover:bg-[#13583C] transition-colors"
            >
              Setup Now
            </button>
          </div>
        )}

        {/* Bio Card */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E4EE]">
            <Briefcase className="w-4 h-4 text-[#176B4A]" />
            <h2 className="text-sm font-bold text-[#172033]">About & Expertise</h2>
          </div>

          {editing ? (
            <textarea
              value={form.bio || ""}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Describe your professional background, technical expertise, past accomplishments, and what clients can expect..."
              rows={4}
              className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg p-3 text-xs text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors resize-none"
              id="profile-bio-input"
            />
          ) : (
            <p className="text-xs text-[#5F6878] leading-relaxed">
              {profile?.bio || <span className="italic text-[#8A93A3]">No bio provided yet.</span>}
            </p>
          )}
        </div>

        {/* Skills Card */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E4EE]">
            <Code className="w-4 h-4 text-[#176B4A]" />
            <h2 className="text-sm font-bold text-[#172033]">Skills & Technologies</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(editing ? form.skills : profile?.skills)?.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 text-xs font-semibold"
              >
                <span>{s}</span>
                {editing && (
                  <button
                    onClick={() => removeSkill(i)}
                    className="text-[#23895A] hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            {(!editing ? profile?.skills?.length === 0 : form.skills?.length === 0) && (
              <span className="italic text-xs text-[#8A93A3]">No skills added yet.</span>
            )}
          </div>

          {editing && (
            <div className="pt-2">
              <input
                placeholder="Type a skill and press Enter (e.g. Solidity, React, Node.js)..."
                className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg px-3 py-2 text-xs text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors"
                id="add-skill-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Portfolio Links Card */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E4EE]">
            <ExternalLink className="w-4 h-4 text-[#176B4A]" />
            <h2 className="text-sm font-bold text-[#172033]">Portfolio & Verifiable Links</h2>
          </div>

          {editing ? (
            <textarea
              value={(form.portfolioLinks || []).join("\n")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  portfolioLinks: e.target.value.split("\n").filter(Boolean),
                }))
              }
              placeholder="https://github.com/your-repo&#10;https://your-portfolio.com"
              rows={3}
              className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg p-3 text-xs font-mono text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors resize-none"
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
                    className="flex items-center gap-2 text-xs text-[#176B4A] hover:underline font-mono"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>{link}</span>
                  </a>
                ))
              ) : (
                <p className="text-xs text-[#8A93A3] italic">No portfolio links added yet.</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}


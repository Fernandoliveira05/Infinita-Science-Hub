// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Upload,
  GitFork,
  DollarSign,
  Edit3,
  Save,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/layouts/Navbar";

const userApi = axios.create({ baseURL: "http://localhost:55403/api/users" });
const repoApi = axios.create({ baseURL: "http://localhost:55403/api/repos" });

// interceptors para JWT
[userApi, repoApi].forEach((api) =>
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
    return config;
  })
);

type UserProfile = {
  address: string;
  username?: string;
  email?: string;
  bio?: string;
  description?: string;
  profile_image_url?: string;
};

type Repository = {
  id: string;
  name: string;
  description?: string;
  forks: number;
  donations: number;
  updated_at: string;
  visibility: string;
};

const Profile = () => {
  const { userId } = useParams();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // edit mode
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // 1) Carrega o perfil alvo (público ou o seu)
        const profileRes = userId
          ? await userApi.get(`/${userId}`)
          : await userApi.get("/me");
        if (!alive) return;

        const target = profileRes.data as UserProfile;
        setUser(target);
        setNewUsername(target.username || "");
        setNewEmail(target.email || "");
        setNewBio(target.bio || "");
        setNewDescription(target.description || "");

        // 2) Verifica se o logado é o dono: busca /me (se houver token) e compara address
        let loggedAddress: string | null = null;
        try {
          const meRes = await userApi.get("/me");
          loggedAddress = (meRes.data?.address || "").toLowerCase();
        } catch {
          // sem JWT ou erro — deixa loggedAddress como null
        }
        const targetAddress = (target.address || "").toLowerCase();
        setIsOwner(!!loggedAddress && loggedAddress === targetAddress);

        // 3) Repositórios do usuário alvo (ou seus)
        const reposRes = userId
          ? await repoApi.get(`/mine`, {
              // Se seu backend aceitar esse header para listar de outro usuário
              headers: { "X-User-Address": userId },
            })
          : await repoApi.get("/mine");
        if (!alive) return;
        setRepos(reposRes.data || []);
      } catch (err) {
        if (!alive) return;
        console.error("Error loading profile or repos:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      const res = await userApi.put("/me", {
        username: newUsername || null,
        email: newEmail || null,
        bio: newBio || null,
        description: newDescription || null,
      });
      setUser(res.data);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || "Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append("file", avatarFile);
      const res = await userApi.post("/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      setAvatarFile(null);
      alert("Avatar updated!");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || "Error updating avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.profile_image_url) return;
    if (!confirm("Remove current avatar?")) return;
    try {
      setIsRemovingAvatar(true);
      // precisa existir no backend: DELETE /api/users/me/avatar
      await userApi.delete("/me/avatar");
      setUser((prev) => (prev ? { ...prev, profile_image_url: undefined } : prev));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail || "Error removing avatar");
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">User not found</p>;

  return (
    <>
      <Navbar currentTitle="Profile" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="card-professional mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar + ações */}
            <div className="flex flex-col items-center md:items-start">
              <div className="w-32 h-32 rounded-2xl overflow-hidden mb-4 shadow-lg relative">
                <img
                  src={user.profile_image_url || "/default-avatar.png"}
                  alt={user.username || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              </div>

              {isOwner && editMode && (
                <div className="flex flex-col gap-2 mb-4 w-full max-w-xs">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUploadAvatar}
                      disabled={!avatarFile || isUploadingAvatar}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload Avatar
                    </button>

                    {user.profile_image_url && (
                      <button
                        onClick={handleRemoveAvatar}
                        disabled={isRemovingAvatar}
                        className="btn-ghost border border-rose-300 text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                      >
                        {isRemovingAvatar ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Campos do perfil */}
              {!editMode ? (
                <>
                  <h1 className="text-3xl font-bold">
                    {user.username || "Your Name Here"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {user.bio || "Tell us about yourself..."}
                  </p>
                  {user.description && (
                    <p className="text-gray-500 mt-2 whitespace-pre-wrap">
                      {user.description}
                    </p>
                  )}
                  {user.email && (
                    <p className="text-gray-500 mt-2">{user.email}</p>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-3 w-full max-w-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="input-professional w-full"
                      placeholder="Username"
                    />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="input-professional w-full"
                      placeholder="Email"
                    />
                  </div>
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="input-professional w-full"
                    placeholder="Short bio"
                    rows={2}
                  />
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="input-professional w-full"
                    placeholder="Profile description (longer text)"
                    rows={4}
                  />
                </div>
              )}

              {/* Botões de ação — visíveis só para o dono */}
              {isOwner && (
                <div className="flex gap-3 mt-4">
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setNewUsername(user.username || "");
                          setNewEmail(user.email || "");
                          setNewBio(user.bio || "");
                          setNewDescription(user.description || "");
                          setAvatarFile(null);
                        }}
                        className="btn-ghost flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Public repositories */}
        <div className="card-professional">
          <h2 className="text-2xl font-bold mb-6">Public Repositories</h2>
          {repos.length > 0 ? (
            <div className="grid gap-6">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="border border-border rounded-xl p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link
                        to={`/repository/${repo.id}`}
                        className="text-lg font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {repo.name}
                      </Link>
                      <p className="text-gray-500 text-sm">
                        {repo.description || "No description provided"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-200">
                      {repo.visibility}
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm text-gray-500">
                    <span className="flex gap-2 items-center">
                      <GitFork className="w-4 h-4" /> {repo.forks} forks
                    </span>
                    <span className="flex gap-2 items-center">
                      <DollarSign className="w-4 h-4" /> {repo.donations} ETH
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No repositories yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;

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
} from "lucide-react";
import { Navbar } from "@/components/layouts/Navbar";

const userApi = axios.create({ baseURL: "http://127.0.0.1:8000/api/users" });
const repoApi = axios.create({ baseURL: "http://127.0.0.1:8000/api/repos" });

// interceptors para JWT
[userApi, repoApi].forEach((api) =>
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  })
);

type UserProfile = {
  address: string;
  username?: string;
  bio?: string;
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
  const [newBio, setNewBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (userId) {
          res = await userApi.get(`/${userId}`);
          setIsOwner(false);
        } else {
          res = await userApi.get("/me");
          setIsOwner(true);
        }
        setUser(res.data);
        setNewUsername(res.data.username || "");
        setNewBio(res.data.bio || "");
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRepos = async () => {
      try {
        const res = userId
          ? await repoApi.get(`/mine`, {
              headers: { "X-User-Address": userId }, // ajustar backend se necessário
            })
          : await repoApi.get("/mine");
        setRepos(res.data);
      } catch (err) {
        console.error("Error loading repositories:", err);
      }
    };

    fetchProfile();
    fetchRepos();
  }, [userId]);

  const handleUpdateProfile = async () => {
    try {
      const res = await userApi.put("/me", {
        username: newUsername,
        bio: newBio,
      });
      setUser(res.data);
      alert("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append("file", avatarFile);
    try {
      const res = await userApi.post("/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      alert("Avatar updated!");
      setAvatarFile(null);
    } catch (err) {
      console.error(err);
      alert("Error updating avatar");
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
            {/* Avatar */}
            <div className="flex flex-col items-center md:items-start">
              <div className="w-32 h-32 rounded-2xl overflow-hidden mb-4 shadow-lg relative">
                <img
                  src={user.profile_image_url || "/default-avatar.png"}
                  alt={user.username || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Upload avatar in edit mode */}
              {isOwner && editMode && (
                <div className="flex flex-col gap-2 mb-4">
                  <input
                    type="file"
                    onChange={(e) =>
                      setAvatarFile(e.target.files?.[0] || null)
                    }
                    className="text-sm"
                  />
                  <button
                    onClick={handleUploadAvatar}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload Avatar
                  </button>
                </div>
              )}

              {!editMode ? (
                <>
                  <h1 className="text-3xl font-bold">
                    {user.username || "Your Name Here"}
                  </h1>
                  <p className="text-gray-600">
                    {user.bio || "Tell us about yourself..."}
                  </p>
                </>
              ) : (
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="input-professional w-full"
                    placeholder="Enter your username"
                  />
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    className="input-professional w-full"
                    placeholder="Write a short bio"
                  />
                </div>
              )}

              {/* Buttons */}
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
                        className="btn-primary flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
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
                        Updated{" "}
                        {new Date(repo.updated_at).toLocaleDateString()}
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

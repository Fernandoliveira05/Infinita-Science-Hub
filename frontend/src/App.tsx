// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom"; // ⟵ sem BrowserRouter aqui
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Explore from "./pages/Explore";
import Repository from "./pages/Repository";
import MyRepository from "./pages/MyRepository";
import Editor from "./pages/Editor";
import Profile from "./pages/Profile";
import Favorite from "./pages/favorites";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/favorites" element={<Favorite />} />
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<Explore />} />

        {/* Páginas de repositório */}
        <Route path="/repository/:id" element={<Repository />} />
        <Route path="/MyRepository" element={<MyRepository />} />

        {/* Editor */}
        <Route path="/editor" element={<Editor />} />               {/* criar novo */}
        <Route path="/editor/:repoId" element={<Editor />} />       {/* editar existente */}

        {/* Perfil */}
        <Route path="/profile/:userId" element={<Profile />} />

        {/* Redirecionamentos/404 opcionais */}
        <Route path="/repository" element={<Navigate to="/explore" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

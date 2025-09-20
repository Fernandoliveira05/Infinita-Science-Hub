// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom"; // ⟵ sem BrowserRouter aqui
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
      {/* NÃO coloque <BrowserRouter> aqui */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/favorites" element={<Favorite />} />
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/repository/:id" element={<Repository />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/MyRepository" element={<MyRepository />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

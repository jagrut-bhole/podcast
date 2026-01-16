"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ProfileUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt?: string | Date;
}

interface ProfileCardProps {
  user: ProfileUser;
  onDelete: () => Promise<void>;
}

export function ProfileCard({ user, onDelete }: ProfileCardProps) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Failed to delete", error);
      setIsDeleting(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl relative">
      <div className="relative p-8 flex flex-col items-center">
        {/* Avatar Section */}
        <div className="mb-6">
          <div className="relative h-28 w-28 rounded-full border-4 border-neutral-800 overflow-hidden bg-neutral-800 flex items-center justify-center shadow-lg">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                fill
                className="object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-neutral-500" />
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center space-y-1 mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            {user.name || "Anonymous User"}
          </h2>
          <div className="flex items-center justify-center text-neutral-400 space-x-2 text-sm">
            <Mail className="h-3.5 w-3.5" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center justify-center text-neutral-500 space-x-2 text-xs uppercase tracking-wider font-medium mt-3">
            <Calendar className="h-3 w-3" />
            <span>Member since {formattedDate}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-neutral-800 mb-8"></div>

        {/* Actions Area */}
        <div className="w-full">
          <AnimatePresence mode="wait" initial={false}>
            {!isDeleteMode ? (
              <motion.div
                key="default-actions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center w-full"
              >
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteMode(true)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/20 w-full transition-all group h-12 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Delete Account
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="delete-confirm"
                initial={{ opacity: 0, scale: 0.95, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: "auto" }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full bg-red-950/10 border border-red-900/20 rounded-xl p-5"
              >
                <div className="flex flex-col items-center text-center mb-5">
                  <div className="h-10 w-10 bg-red-900/20 rounded-full flex items-center justify-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-red-500 font-semibold mb-1">
                    Delete Account?
                  </h3>
                  <p className="text-red-200/60 text-xs leading-relaxed">
                    This action cannot be undone. All your data will be
                    permanently removed.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteMode(false)}
                    disabled={isDeleting}
                    className="border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-300 w-full h-10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white w-full h-10 shadow-lg shadow-red-900/20"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Confirm
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { ArrowLeft, Home, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface NotFound404Props {
  title?: string;
  description?: string;
  className?: string;
}

export default function ErrorPage({
  title = "Page Not Found",
  description = "The page you are looking for does not exist.",
  className,
}: NotFound404Props) {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden bg-[#151515] flex items-center justify-center px-6",
        className,
      )}
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Ghost className="h-16 w-16 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-4xl font-bold bg-clip-text text-white">
            404
          </EmptyTitle>
          <EmptyDescription className="text-lg">{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={handleGoHome}
              className="btn-default group cursor-pointer"
            >
              <Home className="h-4 w-4 mr-1 transition-transform group-hover:scale-110" />
              Go Home
            </Button>

            <Button
              onClick={handleGoBack}
              variant="outline"
              className="group cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1 " />
              Go Back
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}

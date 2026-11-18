import { Star } from "lucide-react";
export function Stars({ n = 5 }: { n?: number }) {
  return (
    <div className="flex gap-0.5 text-orange" role="img" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: n }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" aria-hidden />)}
    </div>
  );
}

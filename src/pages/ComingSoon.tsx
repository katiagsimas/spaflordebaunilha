import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

const ComingSoon = ({ title, description }: ComingSoonProps) => {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />

      <Card className="shadow-soft">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Em Breve</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Estamos trabalhando nesta funcionalidade. Em breve você terá acesso a recursos incríveis!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;

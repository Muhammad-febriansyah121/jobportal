import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes/employer';

type WorkspaceProps = {
    title: string;
    description: string;
    message: string;
};

export default function EmployerWorkspace({
    title,
    description,
    message,
}: WorkspaceProps) {
    return (
        <>
            <Head title={title} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading title={title} description={description} />

                <Card className="border-[#e8edf3]">
                    <CardHeader>
                        <div className="flex size-12 items-center justify-center rounded-lg bg-[#fff4ef] text-[#f45113]">
                            <Sparkles className="size-6" />
                        </div>
                        <CardTitle className="text-[#111827]">
                            {title}
                        </CardTitle>
                        <CardDescription>{message}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href={dashboard()}>
                                Kembali ke Overview
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

import { Trash2, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Skill {
    id: string;
    name: string;
    description: string;
    code: string;
    parameters: any;
}

interface SkillListProps {
    skills: Skill[];
    onDelete: (id: string) => void;
}

export function SkillList({ skills, onDelete }: SkillListProps) {
    if (skills.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Code className="mx-auto mb-3 opacity-50" size={32} />
                <p>No skills defined yet.</p>
                <p className="text-sm mt-1">Create a skill to give your agent new capabilities.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {skills.map((skill) => (
                <div
                    key={skill.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Code size={16} className="text-blue-500" />
                                {skill.name}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">{skill.description}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8"
                            onClick={() => onDelete(skill.id)}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>

                    <div className="mt-3 bg-slate-50 dark:bg-slate-950 rounded-lg p-3 text-xs font-mono overflow-x-auto border border-slate-100 dark:border-slate-800">
                        <div className="text-slate-400 mb-1 select-none">Parameters:</div>
                        <pre className="text-slate-600 dark:text-slate-400">
                            {JSON.stringify(skill.parameters, null, 2)}
                        </pre>
                    </div>
                </div>
            ))}
        </div>
    );
}

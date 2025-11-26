import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";

interface SkillEditorProps {
    initialData?: any;
    onSubmit: (skill: any) => Promise<void>;
    isEditing?: boolean;
}

export function SkillEditor({ initialData, onSubmit, isEditing = false }: SkillEditorProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [code, setCode] = useState(initialData?.code || `def main(args):
    # Your code here
    # args is a dictionary of parameters
    return "Result"`);
    const [parameters, setParameters] = useState(initialData?.parameters ? JSON.stringify(initialData.parameters, null, 2) : `{
  "param_name": {
    "type": "string",
    "description": "Description of the parameter"
  }
}`);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let parsedParams = {};
            try {
                parsedParams = JSON.parse(parameters);
            } catch (err) {
                alert("Invalid JSON parameters");
                setLoading(false);
                return;
            }

            await onSubmit({
                name,
                description,
                code,
                parameters: parsedParams
            });

            // Reset form
            setName("");
            setDescription("");
            // Keep code/params templates or reset them? Let's keep them for now or reset to defaults.
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">{isEditing ? "Edit Skill" : "Create New Skill"}</h3>

            <div className="space-y-2">
                <label className="text-sm font-medium">Function Name</label>
                <Input
                    placeholder="e.g., get_weather"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    pattern="^[a-zA-Z0-9_]+$"
                    title="Alphanumeric and underscores only"
                    disabled={isEditing} // Prevent name change on edit for simplicity (or handle uniqueness check)
                />
                <p className="text-xs text-slate-500">Must be unique for this agent. No spaces.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                    placeholder="What does this skill do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <p className="text-xs text-slate-500">Used by the AI to decide when to call this skill.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Python Code</label>
                <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-sm min-h-[200px]"
                    required
                />
                <p className="text-xs text-slate-500">Must define <code>def main(args):</code> and return a string.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Parameters (JSON Schema)</label>
                <Textarea
                    value={parameters}
                    onChange={(e) => setParameters(e.target.value)}
                    className="font-mono text-sm min-h-[150px]"
                    required
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-2" size={16} />}
                {isEditing ? "Update Skill" : "Create Skill"}
            </Button>
        </form>
    );
}

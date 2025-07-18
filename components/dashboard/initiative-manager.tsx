import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Initiative } from "@/types/initiative.types";

interface InitiativeManagerProps {
  initiatives: Initiative[];
  onChange: (initiatives: Initiative[]) => void;
}

export function InitiativeManager({ initiatives, onChange }: InitiativeManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newInitiative, setNewInitiative] = useState({
    name: "",
    description: "",
    goalAmount: "",
  });

  const handleAdd = () => {
    if (newInitiative.name) {
      const initiative: Partial<Initiative> = {
        id: Date.now().toString(),
        name: newInitiative.name,
        description: newInitiative.description || null,
        goal_amount: newInitiative.goalAmount
          ? Number(newInitiative.goalAmount)
          : null,
        raised_amount: 0,
        is_active: true,
        widget_id: "", // This will be set by the parent component
        created_at: new Date().toISOString(),
      };
      onChange([...initiatives, initiative as Initiative]);
      setNewInitiative({ 
        name: "", 
        description: "", 
        goalAmount: "", 
      });
      setIsAdding(false);
    }
  };

  const handleUpdate = (id: string, updates: Partial<Initiative>) => {
    onChange(initiatives.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const handleDelete = (id: string) => {
    onChange(initiatives.filter((i) => i.id !== id));
  };


  return (
    <div className="space-y-4">
      {initiatives.map((initiative) => (
        <Card key={initiative.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingId === initiative.id ? (
                <div className="space-y-3">
                  <Input
                    value={initiative.name}
                    onChange={(e) =>
                      handleUpdate(initiative.id, { name: e.target.value })
                    }
                    placeholder="Initiative name"
                  />
                  <Textarea
                    value={initiative.description || ""}
                    onChange={(e) =>
                      handleUpdate(initiative.id, { description: e.target.value })
                    }
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <Input
                    type="number"
                    value={initiative.goal_amount || ""}
                    onChange={(e) =>
                      handleUpdate(initiative.id, {
                        goal_amount: Number(e.target.value) || null,
                      })
                    }
                    placeholder="Goal amount (optional)"
                  />
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold">{initiative.name}</h4>
                  {initiative.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {initiative.description}
                    </p>
                  )}
                  {initiative.goal_amount && (
                    <p className="text-sm text-gray-500 mt-1">
                      Goal: ${initiative.goal_amount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Raised: ${initiative.raised_amount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Switch
                checked={initiative.is_active}
                onCheckedChange={(checked) =>
                  handleUpdate(initiative.id, { is_active: checked })
                }
              />
              {editingId === initiative.id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(initiative.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(initiative.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}

      {isAdding ? (
        <Card className="p-4 space-y-3">
          <Input
            value={newInitiative.name}
            onChange={(e) => setNewInitiative({ ...newInitiative, name: e.target.value })}
            placeholder="Initiative name"
            autoFocus
          />
          <Textarea
            value={newInitiative.description}
            onChange={(e) =>
              setNewInitiative({ ...newInitiative, description: e.target.value })
            }
            placeholder="Description (optional)"
            rows={2}
          />
          <Input
            type="number"
            value={newInitiative.goalAmount}
            onChange={(e) =>
              setNewInitiative({ ...newInitiative, goalAmount: e.target.value })
            }
            placeholder="Goal amount (optional)"
          />
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm">
              Add Initiative
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewInitiative({ 
                  name: "", 
                  description: "", 
                  goalAmount: "", 
                });
              }}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Initiative
        </Button>
      )}
    </div>
  );
}
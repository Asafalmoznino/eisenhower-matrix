import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase environment variables are missing.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const categories = [
  { title: "DO immediately", color: "bg-red-500", key: "do" },
  { title: "PLAN and prioritize", color: "bg-orange-500", key: "plan" },
  { title: "DELEGATE for completion", color: "bg-green-500", key: "delegate" },
  { title: "DELETE these tasks", color: "bg-gray-500", key: "delete" },
];

export default function EisenhowerMatrix() {
  const [tasks, setTasks] = useState({ do: [], plan: [], delegate: [], delete: [] });
  const [newTask, setNewTask] = useState("");
  const [importance, setImportance] = useState(1);
  const [urgency, setUrgency] = useState(1);
  const [attachments, setAttachments] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase.from("tasks").select("id, text, importance, urgency, category, due_date, attachments");
        if (error) throw error;
        const sortedTasks = { do: [], plan: [], delegate: [], delete: [] };
        (data || []).forEach(task => {
          if (sortedTasks[task.category]) {
            sortedTasks[task.category].push(task);
          }
        });
        setTasks(sortedTasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };
    fetchTasks();
  }, []);

  const categorizeTask = (importance, urgency) => {
    if (importance >= 6 && urgency >= 6) return "do";
    if (importance >= 6 && urgency < 6) return "plan";
    if (importance < 6 && urgency >= 6) return "delegate";
    return "delete";
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const category = categorizeTask(importance, urgency);
    const taskData = {
      text: newTask,
      importance,
      urgency,
      attachments: attachments ? attachments.name : null,
      due_date: dueDate || null,
      category
    };
    try {
      const { data, error } = await supabase.from("tasks").insert([taskData]).select("id, text, importance, urgency, category, due_date, attachments");
      if (error) throw error;
      setTasks(prevTasks => ({ ...prevTasks, [category]: [...prevTasks[category], ...data] }));
      setNewTask("");
      setImportance(1);
      setUrgency(1);
      setAttachments(null);
      setDueDate("");
      setShowTaskForm(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const removeTask = async (category, id) => {
    try {
      const { error } = await supabase.from("tasks").delete().match({ id });
      if (error) throw error;
      setTasks(prevTasks => ({
        ...prevTasks,
        [category]: prevTasks[category].filter(task => task.id !== id),
      }));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      {categories.map(({ title, color, key }) => (
        <Card key={key} className="p-4">
          <h2 className={`text-white p-2 ${color}`}>{title}</h2>
          <CardContent>
            {tasks[key].map((task) => (
              <div key={task.id} className="flex justify-between items-center my-2">
                <span>{task.text} (Importance: {task.importance}, Urgency: {task.urgency})</span>
                <Button size="sm" variant="destructive" onClick={() => removeTask(key, task.id)}>
                  X
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

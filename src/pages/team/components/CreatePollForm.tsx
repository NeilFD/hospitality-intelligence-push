
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPoll } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreatePollFormProps {
  onClose: () => void;
}

const POLL_COLORS = [
  'bg-blue-100/70 hover:bg-blue-200/80 backdrop-blur-sm border border-blue-200/50', 
  'bg-purple-100/70 hover:bg-purple-200/80 backdrop-blur-sm border border-purple-200/50', 
  'bg-orange-100/70 hover:bg-orange-200/80 backdrop-blur-sm border border-orange-200/50',
  'bg-green-100/70 hover:bg-green-200/80 backdrop-blur-sm border border-green-200/50', 
];

const CreatePollForm: React.FC<CreatePollFormProps> = ({ onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { option_text: '', option_type: 'text' as const, option_order: 0 },
    { option_text: '', option_type: 'text' as const, option_order: 1 }
  ]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const pollMutation = useMutation({
    mutationFn: async ({ question, options, multipleChoice, colorIndex }: {
      question: string;
      options: Array<{ option_text: string, option_type: 'text' | 'image', option_order: number }>;
      multipleChoice: boolean;
      colorIndex: number;
    }) => {
      if (!user) throw new Error('You must be logged in to create a poll');
      
      return await createPoll({
        question,
        author_id: user.id,
        multiple_choice: multipleChoice,
        color: POLL_COLORS[colorIndex]
      }, options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPolls'] });
      toast.success('Poll created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to create poll: ${error.message}`);
    }
  });

  const handleAddOption = () => {
    if (options.length >= 10) {
      toast.warning('Maximum 10 options allowed');
      return;
    }
    setOptions([
      ...options, 
      { 
        option_text: '', 
        option_type: 'text', 
        option_order: options.length 
      }
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning('Minimum 2 options required');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    // Update option_order after removal
    const reorderedOptions = newOptions.map((opt, i) => ({ ...opt, option_order: i }));
    setOptions(reorderedOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].option_text = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a poll question');
      return;
    }
    
    const validOptions = options.filter(opt => opt.option_text.trim() !== '');
    
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }
    
    pollMutation.mutate({
      question,
      options: validOptions,
      multipleChoice,
      colorIndex
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Textarea 
          id="question" 
          placeholder="What's your question?" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="multiple-choice"
          checked={multipleChoice}
          onCheckedChange={setMultipleChoice}
        />
        <Label htmlFor="multiple-choice">Allow multiple selections</Label>
      </div>

      <div>
        <Label>Poll Options</Label>
        <div className="space-y-2 mt-1">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option.option_text}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemoveOption(index)}
                disabled={options.length <= 2}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            disabled={options.length >= 10}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      </div>

      <div>
        <Label>Poll Color</Label>
        <div className="flex space-x-2 mt-1">
          {POLL_COLORS.map((color, index) => (
            <button
              key={color}
              type="button"
              className={`w-6 h-6 rounded-full ${color.split(' ')[0]} ${index === colorIndex ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              onClick={() => setColorIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pollMutation.isPending}>
          {pollMutation.isPending ? 'Creating...' : 'Create Poll'}
        </Button>
      </div>
    </form>
  );
};

export default CreatePollForm;

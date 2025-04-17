
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { Trash2, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { TeamPoll, TeamPollOption, votePoll, updatePollStatus, deletePoll } from '@/services/team-service';
import { useAuthStore } from '@/services/auth-service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TeamPollCardProps {
  poll: TeamPoll;
  authorName?: string;
}

const POLL_COLORS = [
  'bg-blue-100/70 hover:bg-blue-200/80 backdrop-blur-sm border border-blue-200/50', 
  'bg-purple-100/70 hover:bg-purple-200/80 backdrop-blur-sm border border-purple-200/50', 
  'bg-orange-100/70 hover:bg-orange-200/80 backdrop-blur-sm border border-orange-200/50',
  'bg-green-100/70 hover:bg-green-200/80 backdrop-blur-sm border border-green-200/50', 
];

const TeamPollCard: React.FC<TeamPollCardProps> = ({
  poll,
  authorName
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAuthor = user?.id === poll.author_id;
  
  const glassStyle = "bg-opacity-60 backdrop-filter backdrop-blur-sm shadow-lg border border-opacity-30";
  
  // Process poll data to ensure vote counts are correct
  useEffect(() => {
    if (poll.options && poll.votes) {
      // This effect ensures the UI updates when poll data changes
      console.log("Poll data updated:", poll.votes?.length, "votes");
    }
  }, [poll]);
  
  const voteMutation = useMutation({
    mutationFn: votePoll,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['teamPolls'] });
      console.log("Vote mutation success:", result);
      
      if (result.action === 'added') {
        toast.success('Vote added');
      } else if (result.action === 'removed') {
        toast.success('Vote removed');
      }
    },
    onError: (error) => {
      console.error("Vote mutation error:", error);
      toast.error(`Error voting: ${error.message}`);
    },
  });
  
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => 
      updatePollStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPolls'] });
      toast.success(poll.active ? 'Poll closed' : 'Poll reopened');
    },
    onError: (error) => {
      toast.error(`Error updating poll status: ${error.message}`);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deletePoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPolls'] });
      toast.success('Poll deleted');
    },
    onError: (error) => {
      toast.error(`Error deleting poll: ${error.message}`);
    },
  });
  
  const handleVote = (optionId: string) => {
    if (!user) {
      toast.error('You must be logged in to vote');
      return;
    }
    
    if (!poll.active) {
      toast.error('This poll is closed');
      return;
    }
    
    console.log("Casting vote:", { poll_id: poll.id, option_id: optionId, user_id: user.id });
    
    voteMutation.mutate({
      poll_id: poll.id,
      option_id: optionId,
      user_id: user.id
    });
  };
  
  const handleStatusChange = () => {
    if (!isAuthor) return;
    
    statusMutation.mutate({
      id: poll.id,
      active: !poll.active
    });
  };
  
  const handleDelete = () => {
    if (!isAuthor) return;
    
    if (confirm('Are you sure you want to delete this poll?')) {
      deleteMutation.mutate(poll.id);
    }
  };
  
  const hasVotedFor = (optionId: string) => {
    if (!user || !poll.votes) return false;
    return poll.votes.some(vote => vote.user_id === user.id && vote.option_id === optionId);
  };
  
  const hasVoted = () => {
    if (!user || !poll.votes) return false;
    return poll.votes.some(vote => vote.user_id === user.id);
  };
  
  // Process option vote counts correctly
  const getProcessedOptions = () => {
    if (!poll.options) return [];
    
    // Create a map to count votes for each option
    const voteCounts = new Map();
    
    if (poll.votes && poll.votes.length > 0) {
      poll.votes.forEach(vote => {
        const current = voteCounts.get(vote.option_id) || 0;
        voteCounts.set(vote.option_id, current + 1);
      });
    }
    
    // Apply vote counts to options
    return poll.options.map(option => ({
      ...option,
      vote_count: voteCounts.get(option.id) || 0
    }));
  };
  
  const processedOptions = getProcessedOptions();
  
  const chartData = processedOptions.map(option => ({
    name: option.option_text,
    votes: option.vote_count || 0,
    color: '#6366F1'
  }));
  
  const totalVotes = poll.votes?.length || 0;
  
  const hasChartData = chartData.length > 0 && chartData.some(item => item.votes > 0);
  
  // Set a reasonable max value for the chart
  const maxVote = Math.max(...chartData.map(item => item.votes), 0) + 1;
  
  console.log("Chart data:", chartData);
  console.log("Total votes:", totalVotes);
  
  return (
    <Card className={`${poll.color || POLL_COLORS[0]} ${glassStyle} p-4 rounded-lg min-h-[200px] flex flex-col`}>
      <div className="flex justify-between items-start mb-2">
        {poll.active ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Closed
          </span>
        )}
        
        <div className="flex gap-2">
          {isAuthor && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-amber-500" onClick={handleStatusChange}>
                {poll.active ? <AlertCircle size={16} /> : <Check size={16} />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={handleDelete}>
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-1">{poll.question}</h3>
        <p className="text-xs text-gray-600">
          {poll.multiple_choice ? 'Multiple choices allowed' : 'Select one option'}
        </p>
      </div>
      
      <div className="flex-grow">
        <div className="grid gap-2 mb-4">
          {processedOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={cn(
                "p-2 rounded-lg border flex justify-between items-center cursor-pointer transition-all",
                hasVotedFor(option.id) 
                  ? "bg-blue-200/50 border-blue-300" 
                  : "bg-white/50 border-gray-200 hover:bg-blue-50"
              )}
            >
              <div className="flex items-center">
                <div className="mr-2">
                  {hasVotedFor(option.id) ? (
                    poll.multiple_choice ? <CheckCheck size={18} /> : <Check size={18} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-gray-300" />
                  )}
                </div>
                <span>{option.option_text}</span>
              </div>
              
              <div className="flex flex-shrink-0 items-center">
                <span className="text-sm font-semibold mr-2">{option.vote_count || 0}</span>
                <div className="flex -space-x-1 overflow-hidden">
                  {option.voters?.slice(0, 3).map(voter => (
                    <Avatar key={voter.id} className="h-6 w-6 border-2 border-white">
                      {voter.avatar_url ? (
                        <AvatarImage src={voter.avatar_url} alt={voter.first_name || 'User'} />
                      ) : (
                        <AvatarFallback>
                          {voter.first_name?.[0] || '?'}{voter.last_name?.[0] || ''}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  {(option.voters?.length || 0) > 3 && (
                    <Avatar className="h-6 w-6 border-2 border-white">
                      <AvatarFallback>
                        +{(option.voters?.length || 0) - 3}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {totalVotes > 0 && (
          <div className="mt-4 h-40 w-full bg-white/90 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                barGap={12}
              >
                <XAxis 
                  dataKey="name"
                  tickLine={false}
                  axisLine={true}
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, maxVote]}
                  ticks={Array.from({length: maxVote + 1}, (_, i) => i)}
                  tickLine={false}
                  axisLine={true}
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  width={20}
                />
                <Bar 
                  dataKey="votes" 
                  radius={[6, 6, 0, 0]}
                  barSize={60}
                  minPointSize={5}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366F1" fillOpacity={0.8} />
                  ))}
                  <LabelList 
                    dataKey="votes" 
                    position="top" 
                    fill="#4B5563" 
                    fontSize={13} 
                    fontWeight="600"
                    formatter={(value: number) => value.toString()}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>{new Date(poll.created_at).toLocaleDateString()}</span>
        {authorName && <span className="italic">- {authorName}</span>}
      </div>
    </Card>
  );
};

export default TeamPollCard;

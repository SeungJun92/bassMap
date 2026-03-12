import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Send, MessageSquare, User, Clock, Zap } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    created_at: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Get current user session
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        // Initial fetch
        fetchMessages();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('public:chat_messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => [...prev, newMessage]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(50);

        if (error) console.error('Error fetching messages:', error);
        else setMessages(data || []);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const { error } = await supabase.from('chat_messages').insert([
            {
                content: newMessage,
                user_id: user.id,
                user_name: user.user_metadata.full_name || user.email,
                user_avatar: user.user_metadata.avatar_url || '',
            },
        ]);

        if (error) {
            console.error('Error sending message:', error);
            alert('메시지 전송에 실패했습니다.');
        } else {
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-slate-800/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <MessageSquare className="text-white" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
                            실시간 태클박스 (Realtime Chat)
                        </h2>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            LIVE ANALYSIS ACTIVE
                        </div>
                    </div>
                </div>
                <div className="group relative">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-white/5 cursor-help">
                        <Zap size={14} className="text-amber-400 fill-amber-400/20" />
                        <span className="text-[11px] font-bold text-slate-300">AI 분석 중</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-8">
                        <MessageSquare size={48} className="mb-4" />
                        <p className="text-sm font-medium">아직 대화가 없습니다.<br />오늘의 조과나 포인트를 공유해보세요!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = user && msg.user_id === user.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar */}
                                <div className="flex-none">
                                    <div className={`w-8 h-8 rounded-lg overflow-hidden border ${isMe ? 'border-sky-500/30' : 'border-white/10'} bg-slate-800 flex items-center justify-center`}>
                                        {msg.user_avatar ? (
                                            <img src={msg.user_avatar} alt={msg.user_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={14} className="text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] font-bold text-slate-500 mb-1 ml-1 pr-1">
                                        {msg.user_name}
                                    </span>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                        ? 'bg-sky-500 text-white rounded-tr-none shadow-sky-500/10'
                                        : 'bg-slate-800/80 text-slate-100 border border-white/5 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[9px] text-slate-600 mt-1 flex items-center gap-1">
                                        <Clock size={8} />
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-white/5 pb-8">
                <form onSubmit={handleSendMessage} className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={user ? "메시지를 입력하세요..." : "로그인이 필요합니다"}
                        disabled={!user}
                        className="w-full bg-slate-800/50 border border-slate-700/50 focus:border-sky-500/50 rounded-2xl py-4 pl-5 pr-14 text-sm outline-none transition-all placeholder:text-slate-600"
                    />
                    <button
                        type="submit"
                        disabled={!user || !newMessage.trim()}
                        className="absolute right-2 top-2 w-10 h-10 bg-sky-500 hover:bg-sky-400 disabled:opacity-30 disabled:hover:bg-sky-50 text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="text-[10px] text-slate-600 mt-3 text-center">
                    낚시 매너를 지켜주세요. 비방이나 욕설은 차단될 수 있습니다.
                </p>
            </div>
        </div>
    );
}

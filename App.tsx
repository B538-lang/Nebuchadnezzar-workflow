import React, { useState } from 'react';
import type { GeneratedContent, ScheduledPost } from './types';
import { generateSocialContent, generateGraphicImage } from './services/geminiService';
import { FacebookIcon, LinkedInIcon, SparklesIcon, TwitterIcon, ImageIcon, CalendarIcon } from "./components/Icons.tsx";
import CopyButton from './components/CopyButton';
import ScheduleModal from './components/ScheduleModal';

type Platform = 'linkedinPost' | 'facebookPost' | 'twitterPost' | 'graphicText';

const App: React.FC = () => {
  const [articleExcerpt, setArticleExcerpt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    linkedinPost: true,
    facebookPost: true,
    twitterPost: true,
    graphicText: true,
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState<{ platform: 'LinkedIn' | 'Twitter' | 'Facebook' | 'Graphic Text'; content: string; } | null>(null);

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleGenerate = async () => {
    if (!articleExcerpt.trim()) {
      setError('Article excerpt is required.');
      return;
    }
    const atLeastOnePlatformSelected = Object.values(selectedPlatforms).some(v => v);
    if (!atLeastOnePlatformSelected) {
      setError('Please select at least one platform.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setIsImageLoading(false);

    try {
      const content = await generateSocialContent(articleExcerpt, selectedPlatforms);
      setGeneratedContent(content);

      if (content.graphicText?.text) {
        setIsImageLoading(true);
        try {
          const imageUrl = await generateGraphicImage(content.graphicText.text);
          setGeneratedContent(prevContent => {
            if (!prevContent || !prevContent.graphicText) return prevContent;
            return {
              ...prevContent,
              graphicText: {
                ...prevContent.graphicText,
                imageUrl: imageUrl,
              }
            };
          });
        } catch (imgErr) {
          console.error("Failed to generate graphic image:", imgErr);
        } finally {
          setIsImageLoading(false);
        }
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenScheduleModal = (platform: 'LinkedIn' | 'Twitter' | 'Facebook' | 'Graphic Text', content: string) => {
    setPostToSchedule({ platform, content });
    setIsScheduleModalOpen(true);
  };

  const handleConfirmSchedule = (scheduledTime: Date) => {
    if (!postToSchedule) return;

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      platform: postToSchedule.platform,
      content: postToSchedule.content,
      scheduledTime,
    };
    setScheduledPosts(prev => [...prev, newPost].sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()));
    setIsScheduleModalOpen(false);
    setPostToSchedule(null);
  };

  const platformOptions: { id: Platform, label: string, Icon: React.FC<{className?: string}>, color: string }[] = [
      { id: 'linkedinPost', label: 'LinkedIn', Icon: LinkedInIcon, color: 'text-brand-linkedin' },
      { id: 'facebookPost', label: 'Facebook', Icon: FacebookIcon, color: 'text-brand-blue' },
      { id: 'twitterPost', label: 'X / Twitter', Icon: TwitterIcon, color: 'text-brand-twitter' },
      { id: 'graphicText', label: 'Graphic Text', Icon: ImageIcon, color: 'text-gray-300' },
  ];

  const twitterAvailable = !!generatedContent?.twitterPost;
  const graphicAvailable = !!generatedContent?.graphicText;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          Viral Post Generator
        </h1>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
          Convert any article or text into platform-specific social media posts in seconds.
        </p>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-4 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><span className="text-3xl mr-2">1.</span> Add Your Content</h2>
          <div className="space-y-4">
            <textarea
              className="w-full h-60 bg-gray-900/70 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              placeholder="Paste your article excerpt here..."
              value={articleExcerpt}
              onChange={(e) => setArticleExcerpt(e.target.value)}
            />
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Platforms to generate</h3>
              <div className="space-y-2">
                {platformOptions.map(({ id, label, Icon, color }) => (
                  <label key={id} htmlFor={id} className="flex items-center justify-between p-2 bg-gray-900/70 rounded-md cursor-pointer hover:bg-gray-800/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id={id} className="sr-only peer" checked={selectedPlatforms[id]} onChange={() => handlePlatformToggle(id)} />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Posts
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-2xl font-semibold flex items-center"><span className="text-3xl mr-2">2.</span> Your AI-Generated Content</h2>
          {generatedContent ? (
            <div className="space-y-6">
              {/* LinkedIn Card */}
              {generatedContent.linkedinPost && (
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 relative">
                  <CopyButton textToCopy={generatedContent.linkedinPost.copy} />
                  <h3 className="flex items-center text-lg font-bold mb-3 text-brand-linkedin"><LinkedInIcon className="w-6 h-6 mr-2" />LinkedIn Post</h3>
                  <p className="whitespace-pre-wrap text-gray-300 text-sm mb-3">{generatedContent.linkedinPost.copy}</p>
                  <button onClick={() => handleOpenScheduleModal('LinkedIn', generatedContent.linkedinPost!.copy)} className="w-full mt-4 text-sm font-semibold py-2 px-4 rounded-md bg-brand-linkedin/20 hover:bg-brand-linkedin/40 text-brand-linkedin transition flex items-center justify-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Schedule Post
                  </button>
                </div>
              )}

              {/* Facebook Card */}
              {generatedContent.facebookPost && (
                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 relative">
                  <CopyButton textToCopy={`${generatedContent.facebookPost.copy} ${generatedContent.facebookPost.hashtags.join(' ')}`} />
                  <h3 className="flex items-center text-lg font-bold mb-3 text-brand-blue"><FacebookIcon className="w-6 h-6 mr-2" />Facebook Post</h3>
                  <p className="whitespace-pre-wrap text-gray-300 text-sm mb-3">{generatedContent.facebookPost.copy}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {generatedContent.facebookPost.hashtags.map((tag, i) => <span key={i} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">{tag}</span>)}
                  </div>
                  <button onClick={() => handleOpenScheduleModal('Facebook', `${generatedContent.facebookPost!.copy} ${generatedContent.facebookPost!.hashtags.join(' ')}`)} className="w-full text-sm font-semibold py-2 px-4 rounded-md bg-brand-blue/20 hover:bg-brand-blue/40 text-brand-blue transition flex items-center justify-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Schedule Post
                  </button>
                </div>
              )}

              {twitterAvailable && graphicAvailable ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Twitter Card */}
                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 relative">
                    <CopyButton textToCopy={`${generatedContent.twitterPost!.copy} ${generatedContent.twitterPost!.hashtags.join(' ')}`} />
                    <h3 className="flex items-center text-lg font-bold mb-3 text-brand-twitter"><TwitterIcon className="w-6 h-6 mr-2" />X / Twitter Post</h3>
                    <p className="whitespace-pre-wrap text-gray-300 text-sm mb-3">{generatedContent.twitterPost!.copy}</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.twitterPost!.hashtags.map((tag, i) => <span key={i} className="text-xs bg-sky-900/50 text-sky-300 px-2 py-1 rounded">{tag}</span>)}
                    </div>
                    <button onClick={() => handleOpenScheduleModal('Twitter', `${generatedContent.twitterPost!.copy} ${generatedContent.twitterPost!.hashtags.join(' ')}`)} className="w-full mt-4 text-sm font-semibold py-2 px-4 rounded-md bg-brand-twitter/20 hover:bg-brand-twitter/40 text-brand-twitter transition flex items-center justify-center gap-2">
                       <CalendarIcon className="w-4 h-4" />
                       Schedule Post
                    </button>
                  </div>
                  
                  {/* Graphic Text Card */}
                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 relative">
                    <CopyButton textToCopy={generatedContent.graphicText!.text} />
                    <h3 className="flex items-center text-lg font-bold mb-3 text-gray-300"><ImageIcon className="w-6 h-6 mr-2" />Graphic Text</h3>
                    {isImageLoading ? (
                      <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg">
                        <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="ml-3 text-gray-400">Generating image...</span>
                      </div>
                    ) : generatedContent.graphicText?.imageUrl ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden my-4">
                        <img src={generatedContent.graphicText.imageUrl} alt={generatedContent.graphicText.text} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                            <p className="text-xl italic font-serif text-white text-center leading-tight">"{generatedContent.graphicText.text}"</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xl italic font-serif bg-gray-900/50 p-4 rounded text-center my-4">"{generatedContent.graphicText!.text}"</p>
                    )}
                    <button onClick={() => handleOpenScheduleModal('Graphic Text', generatedContent.graphicText!.text)} className="w-full mt-4 text-sm font-semibold py-2 px-4 rounded-md bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 transition flex items-center justify-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Schedule Idea
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {twitterAvailable && (
                    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 relative">
                      <CopyButton textToCopy={`${generatedContent.twitterPost!.copy} ${generatedContent.twitterPost!.hashtags.join(' ')}`} />
                      <h3 className="flex items-center text-lg font-bold mb-3 text-brand-twitter"><TwitterIcon className="w-6 h-6 mr-2" />X / Twitter Post</h3>
                      <p className="whitespace-pre-wrap text-gray-300 text-sm mb-3">{generatedContent.twitterPost!.copy}</p>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.twitterPost!.hashtags.map((tag, i) => <span key={i} className="text-xs bg-sky-900/50 text-sky-300 px-2 py-1 rounded">{tag}</span>)}
                      </div>
                      <button onClick={() => handleOpenScheduleModal('Twitter', `${generatedContent.twitterPost!.copy} ${generatedContent.twitterPost!.hashtags.join(' ')}`)} className="w-full mt-4 text-sm font-semibold py-2 px-4 rounded-md bg-brand-twitter/20 hover:bg-brand-twitter/40 text-brand-twitter transition flex items-center justify-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Schedule Post
                      </button>
                    </div>
                  )}
                  {graphicAvailable && (
                    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 relative">
                      <CopyButton textToCopy={generatedContent.graphicText!.text} />
                      <h3 className="flex items-center text-lg font-bold mb-3 text-gray-300"><ImageIcon className="w-6 h-6 mr-2" />Graphic Text</h3>
                      {isImageLoading ? (
                        <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg">
                          <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="ml-3 text-gray-400">Generating image...</span>
                        </div>
                      ) : generatedContent.graphicText?.imageUrl ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden my-4">
                          <img src={generatedContent.graphicText.imageUrl} alt={generatedContent.graphicText.text} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                              <p className="text-xl italic font-serif text-white text-center leading-tight">"{generatedContent.graphicText.text}"</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xl italic font-serif bg-gray-900/50 p-4 rounded text-center my-4">"{generatedContent.graphicText!.text}"</p>
                      )}
                      <button onClick={() => handleOpenScheduleModal('Graphic Text', generatedContent.graphicText!.text)} className="w-full mt-4 text-sm font-semibold py-2 px-4 rounded-md bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 transition flex items-center justify-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Schedule Idea
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-96 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700/50">
              <SparklesIcon className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400">Your content will appear here</h3>
              <p className="text-gray-500">Select platforms, add content, and click generate!</p>
            </div>
          )}
        </div>

         {/* Scheduling Panel */}
        <div className="lg:col-span-12 bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><span className="text-3xl mr-2">3.</span> Scheduled Posts</h2>
          <div className="space-y-3">
            {scheduledPosts.length > 0 ? (
              scheduledPosts.map(post => (
                <div key={post.id} className="bg-gray-900/70 p-3 rounded-lg flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {post.platform === 'LinkedIn' && <LinkedInIcon className="w-8 h-8 text-brand-linkedin" />}
                    {post.platform === 'Facebook' && <FacebookIcon className="w-8 h-8 text-brand-blue" />}
                    {post.platform === 'Twitter' && <TwitterIcon className="w-8 h-8 text-brand-twitter" />}
                    {post.platform === 'Graphic Text' && <ImageIcon className="w-8 h-8 text-gray-400" />}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-sm text-gray-300 truncate">{post.content}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>{post.scheduledTime.toLocaleDateString()}</p>
                    <p>{post.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No posts scheduled yet. Generate content and click "Schedule Post".</p>
            )}
            {scheduledPosts.length > 0 && <p className="text-xs text-center text-gray-600 mt-2">Note: This is a simulation. Posts are not sent and will be cleared on page refresh.</p>}
          </div>
        </div>
      </main>
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onConfirm={handleConfirmSchedule}
        platform={postToSchedule?.platform || ''}
      />
    </div>
  );
};

export default App;

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface Discussion {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  _count: {
    posts: number;
    likes: number;
    views: number;
  };
  isLiked?: boolean;
  isFollowing?: boolean;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  memberCount: number;
  isMember: boolean;
  _count: {
    discussions: number;
  };
}

interface ExpertSession {
  id: string;
  title: string;
  description: string;
  expertName: string;
  expertBio: string;
  category: string;
  startTime: string;
  endTime: string;
  status: string;
  attendeeCount: number;
  isAttending: boolean;
  isLive: boolean;
  questionCount: number;
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'discussions' | 'study-groups' | 'expert-sessions'>('discussions');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [expertSessions, setExpertSessions] = useState<ExpertSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'discussions':
          await fetchDiscussions();
          break;
        case 'study-groups':
          await fetchStudyGroups();
          break;
        case 'expert-sessions':
          await fetchExpertSessions();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    const response = await fetch('/api/community/discussions?limit=20');
    const data = await response.json();
    if (response.ok) {
      setDiscussions(data.discussions);
    }
  };

  const fetchStudyGroups = async () => {
    const response = await fetch('/api/community/study-groups?limit=20');
    const data = await response.json();
    if (response.ok) {
      setStudyGroups(data.studyGroups);
    }
  };

  const fetchExpertSessions = async () => {
    const response = await fetch('/api/community/expert-sessions?status=upcoming&limit=20');
    const data = await response.json();
    if (response.ok) {
      setExpertSessions(data.expertSessions);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="h-12 bg-gray-300 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Community Hub
          </h1>
          <p className="text-lg text-gray-600">
            Connect with fellow learners, join study groups, and participate in expert sessions.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('discussions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discussions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 inline mr-2" />
                Discussions
              </button>
              <button
                onClick={() => setActiveTab('study-groups')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'study-groups'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 inline mr-2" />
                Study Groups
              </button>
              <button
                onClick={() => setActiveTab('expert-sessions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'expert-sessions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AcademicCapIcon className="w-5 h-5 inline mr-2" />
                Expert Sessions
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Latest Discussions</h2>
                  <Link
                    href="/learn/community/discussions/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Discussion
                  </Link>
                </div>

                {discussions.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No discussions yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start the first discussion in the community.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {discussions.map((discussion) => (
                      <div key={discussion.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Link
                                href={`/learn/community/discussions/${discussion.id}`}
                                className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                              >
                                {discussion.title}
                              </Link>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {discussion.category}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {discussion.content}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span>By {discussion.createdBy.name}</span>
                                <span>{formatDate(discussion.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                  <EyeIcon className="w-4 h-4 mr-1" />
                                  <span>{discussion._count.views}</span>
                                </div>
                                <div className="flex items-center">
                                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                                  <span>{discussion._count.posts}</span>
                                </div>
                                <div className="flex items-center">
                                  <HeartIcon className="w-4 h-4 mr-1" />
                                  <span>{discussion._count.likes}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 mt-3">
                              {discussion.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Study Groups Tab */}
            {activeTab === 'study-groups' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Study Groups</h2>
                  <Link
                    href="/learn/community/study-groups/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Group
                  </Link>
                </div>

                {studyGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No study groups yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create a study group to collaborate with others.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyGroups.map((group) => (
                      <div key={group.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {group.name}
                          </h3>
                          {group.isPrivate && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Private
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {group.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>By {group.createdBy.name}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <UserGroupIcon className="w-4 h-4 mr-1" />
                            <span>{group.memberCount} members</span>
                          </div>
                          <div className="flex items-center">
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                            <span>{group._count.discussions} discussions</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Link
                            href={`/learn/community/study-groups/${group.id}`}
                            className="flex-1 text-center px-4 py-2 border border-gray-300 font-medium text-gray-700 bg-white rounded-md text-sm hover:bg-gray-50"
                          >
                            View Group
                          </Link>
                          {group.isMember ? (
                            <button className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600">
                              Member
                            </button>
                          ) : (
                            <Link
                              href={`/learn/community/study-groups/${group.id}/join`}
                              className="flex-1 text-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              Join Group
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expert Sessions Tab */}
            {activeTab === 'expert-sessions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Expert Sessions</h2>
                  <Link
                    href="/learn/community/expert-sessions/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Schedule Session
                  </Link>
                </div>

                {expertSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming sessions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to schedule an expert session.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {expertSessions.map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {session.title}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                {session.status}
                              </span>
                              {session.isLive && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                                  LIVE
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-3">
                              {session.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <AcademicCapIcon className="w-4 h-4 mr-1" />
                                <span>{session.expertName}</span>
                              </div>
                              <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                <span>{formatDateTime(session.startTime)}</span>
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {session.category}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{session.attendeeCount} attendees</span>
                                <span>{session.questionCount} questions</span>
                              </div>
                              <div className="flex space-x-2">
                                <Link
                                  href={`/learn/community/expert-sessions/${session.id}`}
                                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  View Details
                                </Link>
                                {session.isAttending ? (
                                  <button className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600">
                                    Attending
                                  </button>
                                ) : (
                                  <Link
                                    href={`/learn/community/expert-sessions/${session.id}/join`}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    Join Session
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
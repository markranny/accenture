'use client';

import { useState } from 'react';
import { Search, Filter, Tag, Users, MapPin, Building } from 'lucide-react';

interface KeyTopicsProps {
  topics: string[];
  entities: string[];
}

export function KeyTopics({ topics, entities }: KeyTopicsProps) {
  const [filter, setFilter] = useState<'all' | 'topics' | 'entities'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Categorize entities (this is a simple heuristic - in production you'd use NER)
  const categorizeEntities = (entities: string[]) => {
    const categories = {
      people: [] as string[],
      places: [] as string[],
      organizations: [] as string[],
      other: [] as string[]
    };

    entities.forEach(entity => {
      const lower = entity.toLowerCase();
      if (lower.includes('corp') || lower.includes('inc') || lower.includes('ltd') || 
          lower.includes('company') || lower.includes('organization')) {
        categories.organizations.push(entity);
      } else if (lower.includes('city') || lower.includes('country') || 
                 lower.includes('state') || lower.includes('street')) {
        categories.places.push(entity);
      } else if (entity.split(' ').length <= 3 && /^[A-Z]/.test(entity)) {
        // Simple heuristic for people names
        categories.people.push(entity);
      } else {
        categories.other.push(entity);
      }
    });

    return categories;
  };

  const categorizedEntities = categorizeEntities(entities);

  const getTopicRelevanceScore = (topic: string) => {
    // Simple relevance scoring based on length and common words
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = topic.toLowerCase().split(' ');
    const relevantWords = words.filter(word => !commonWords.includes(word));
    return Math.min(100, relevantWords.length * 20 + Math.random() * 20);
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || filter === 'topics';
    return matchesSearch && matchesFilter;
  });

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || filter === 'entities';
    return matchesSearch && matchesFilter;
  });

  const TopicBadge = ({ topic, relevance }: { topic: string; relevance: number }) => (
    <div className="group relative">
      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
        relevance >= 70 
          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
          : relevance >= 40
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      }`}>
        <Tag className="w-3 h-3 mr-1" />
        {topic}
      </span>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
        Relevance: {Math.round(relevance)}%
      </div>
    </div>
  );

  const EntityBadge = ({ entity, category }: { entity: string; category: string }) => {
    const getIcon = () => {
      switch (category) {
        case 'people': return <Users className="w-3 h-3 mr-1" />;
        case 'places': return <MapPin className="w-3 h-3 mr-1" />;
        case 'organizations': return <Building className="w-3 h-3 mr-1" />;
        default: return <Tag className="w-3 h-3 mr-1" />;
      }
    };

    const getColor = () => {
      switch (category) {
        case 'people': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
        case 'places': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
        case 'organizations': return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
        default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      }
    };

    return (
      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${getColor()}`}>
        {getIcon()}
        {entity}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics and entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="topics">Topics Only</option>
              <option value="entities">Entities Only</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{topics.length}</div>
            <div className="text-sm text-gray-600">Topics</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{entities.length}</div>
            <div className="text-sm text-gray-600">Entities</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{categorizedEntities.people.length}</div>
            <div className="text-sm text-gray-600">People</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{categorizedEntities.organizations.length}</div>
            <div className="text-sm text-gray-600">Organizations</div>
          </div>
        </div>
      </div>

      {/* Key Topics */}
      {(filter === 'all' || filter === 'topics') && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-blue-600" />
            Key Topics
            <span className="ml-2 text-sm text-gray-500">({filteredTopics.length})</span>
          </h3>
          
          {filteredTopics.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {filteredTopics.map((topic, index) => (
                <TopicBadge 
                  key={index} 
                  topic={topic} 
                  relevance={getTopicRelevanceScore(topic)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No topics match your search' : 'No topics identified'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Named Entities by Category */}
      {(filter === 'all' || filter === 'entities') && (
        <div className="space-y-4">
          {/* People */}
          {categorizedEntities.people.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                People
                <span className="ml-2 text-sm text-gray-500">({categorizedEntities.people.length})</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {categorizedEntities.people
                  .filter(entity => entity.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((entity, index) => (
                    <EntityBadge key={index} entity={entity} category="people" />
                  ))}
              </div>
            </div>
          )}

          {/* Organizations */}
          {categorizedEntities.organizations.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-indigo-600" />
                Organizations
                <span className="ml-2 text-sm text-gray-500">({categorizedEntities.organizations.length})</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {categorizedEntities.organizations
                  .filter(entity => entity.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((entity, index) => (
                    <EntityBadge key={index} entity={entity} category="organizations" />
                  ))}
              </div>
            </div>
          )}

          {/* Places */}
          {categorizedEntities.places.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                Places
                <span className="ml-2 text-sm text-gray-500">({categorizedEntities.places.length})</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {categorizedEntities.places
                  .filter(entity => entity.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((entity, index) => (
                    <EntityBadge key={index} entity={entity} category="places" />
                  ))}
              </div>
            </div>
          )}

          {/* Other Entities */}
          {categorizedEntities.other.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-gray-600" />
                Other Entities
                <span className="ml-2 text-sm text-gray-500">({categorizedEntities.other.length})</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {categorizedEntities.other
                  .filter(entity => entity.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((entity, index) => (
                    <EntityBadge key={index} entity={entity} category="other" />
                  ))}
              </div>
            </div>
          )}

          {/* No entities found */}
          {filteredEntities.length === 0 && entities.length === 0 && (
            <div className="card">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No named entities identified</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Insights */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Content Analysis Insights</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <div>
              <strong>Topic Diversity:</strong> {topics.length > 5 ? 'High' : topics.length > 2 ? 'Moderate' : 'Low'} - 
              The transcript covers {topics.length} distinct topics, indicating {
                topics.length > 5 ? 'comprehensive coverage of multiple subjects' :
                topics.length > 2 ? 'focused discussion with some variety' :
                'concentrated focus on specific themes'
              }.
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <div>
              <strong>Entity Recognition:</strong> {entities.length} entities identified, including {
                categorizedEntities.people.length > 0 ? `${categorizedEntities.people.length} people` : 'no people'
              }{categorizedEntities.organizations.length > 0 ? `, ${categorizedEntities.organizations.length} organizations` : ''}{
                categorizedEntities.places.length > 0 ? `, and ${categorizedEntities.places.length} places` : ''
              }.
            </div>
          </div>

          {topics.length > 0 && (
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div>
                <strong>Primary Focus:</strong> The most prominent topics appear to be related to{' '}
                <em>{topics.slice(0, 3).join(', ')}</em>, suggesting the content is{' '}
                {topics.some(t => t.toLowerCase().includes('business') || t.toLowerCase().includes('meeting')) ? 'business-oriented' :
                 topics.some(t => t.toLowerCase().includes('education') || t.toLowerCase().includes('training')) ? 'educational' :
                 'conversational'} in nature.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
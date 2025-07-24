import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, Settings, User, X } from 'lucide-react-native';
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: 'chat' | 'personal' | 'calendar-sync' | null;
  onSectionChange: (section: 'chat' | 'personal' | 'calendar-sync' | null) => void;
  companyName?: string;
  team?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  companyName,
  team
}) => {
  const sections = [
    {
      id: 'chat' as const,
      title: 'Gruppchatt',
      description: 'Chatta med ditt skiftlag',
      icon: MessageSquare,
      color: '#4ECDC4'
    },
    {
      id: 'personal' as const,
      title: 'Personligt schema',
      description: 'Hantera semester och frånvaro',
      icon: User,
      color: '#FF6B6B'
    },
    {
      id: 'calendar-sync' as const,
      title: 'Kalendersynk',
      description: 'Synka med extern kalender',
      icon: Calendar,
      color: '#45B7D1'
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Meny</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Current selection */}
            {(companyName || team) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Aktuell val</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {companyName && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Företag:</span>
                      <span className="ml-2 font-medium">{companyName}</span>
                    </div>
                  )}
                  {team && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Lag:</span>
                      <span className="ml-2 font-medium">{team}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation sections */}
            <div className="space-y-3">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <Card
                    key={section.id}
                    className={`cursor-pointer transition-all ${
                      isActive
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSectionChange(section.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: section.color }}
                        >
                          <Icon size={20} color="white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{section.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Placeholder content for active section */}
            {activeSection && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {sections.find(s => s.id === activeSection)?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      {(() => {
                        const section = sections.find(s => s.id === activeSection);
                        const Icon = section?.icon || Settings;
                        return <Icon size={32} color="#666" />;
                      })()}
                    </div>
                    <p className="text-muted-foreground">
                      {activeSection === 'chat' && 'Gruppchatt kommer snart...'}
                      {activeSection === 'personal' && 'Personligt schema kommer snart...'}
                      {activeSection === 'calendar-sync' && 'Kalendersynk kommer snart...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onSectionChange(null)}
            >
              Stäng
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}; 
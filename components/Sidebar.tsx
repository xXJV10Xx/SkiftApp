import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, User, X, Calendar } from 'lucide-react-native';
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
  const sidebarSections = [
    {
      id: 'chat' as const,
      title: 'Chatt',
      description: 'Meddelanden och kommunikation',
      icon: MessageCircle,
      color: '#10B981'
    },
    {
      id: 'personal' as const,
      title: 'Personligt',
      description: 'Din profil och inställningar',
      icon: User,
      color: '#8B5CF6'
    },
    {
      id: 'calendar-sync' as const,
      title: 'Kalendersynk',
      description: 'Synkronisera med externa kalendrar',
      icon: Calendar,
      color: '#F59E0B'
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full w-80 bg-card border-r border-border z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Menyer</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X size={16} color="#6B7280" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Company Info */}
            {companyName && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold">{companyName}</h3>
                    {team && <p className="text-sm text-muted-foreground">Lag {team}</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Sections */}
            <div className="space-y-3">
              {sidebarSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <Card
                    key={section.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isActive ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => onSectionChange(section.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: section.color }}
                        >
                          <Icon size={20} color="#FFFFFF" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{section.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Section Content */}
            {activeSection && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {sidebarSections.find(s => s.id === activeSection)?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeSection === 'chat' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Chatt funktionalitet kommer snart...
                      </p>
                      <div className="flex justify-center">
                        {(() => {
                          const Icon = MessageCircle;
                          return <Icon size={64} color="#6B7280" />;
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {activeSection === 'personal' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Personliga inställningar kommer snart...
                      </p>
                      <div className="flex justify-center">
                        {(() => {
                          const Icon = User;
                          return <Icon size={64} color="#6B7280" />;
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {activeSection === 'calendar-sync' && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Kalendersynkronisering kommer snart...
                      </p>
                      <div className="flex justify-center">
                        {(() => {
                          const Icon = Calendar;
                          return <Icon size={64} color="#6B7280" />;
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}; 
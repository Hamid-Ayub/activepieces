import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  EllipsisVertical,
  Folder,
  FolderOpen,
  Plus,
  Workflow,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { CreateFlowDropdown } from '@/app/routes/flows';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSkeleton,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { CreateFolderDialog } from '@/features/folders/component/create-folder-dialog';
import { FolderActions } from '@/features/folders/component/folder-actions';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { FolderDto, Permission, PopulatedFlow } from '@activepieces/shared';

import FlowActionMenu from '../flow-actions-menu';

interface FlowsByFolder {
  [folderId: string]: PopulatedFlow[];
}

export function FoldersSection() {
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const { project } = projectHooks.useCurrentProject();
  const userHasPermissionToUpdateFolders = checkAccess(Permission.WRITE_FOLDER);
  const { flowId: currentFlowId } = useParams();

  const {
    folders,
    isLoading: foldersLoading,
    refetch: refetchFolders,
  } = foldersHooks.useFolders();

  const {
    data: flows,
    isLoading: flowsLoading,
    refetch: refetchFlows,
  } = useQuery({
    queryKey: ['flow-table', project.id],
    staleTime: 0,
    queryFn: () => {
      return flowsApi.list({
        projectId: project.id,
        cursor: undefined,
        limit: 100000,
      });
    },
  });

  const flowsData = flows?.data || [];

  const flowsByFolder = flowsData.reduce<FlowsByFolder>((acc, flow) => {
    const folderId = flow.folderId || 'default';
    if (!acc[folderId]) {
      acc[folderId] = [];
    }
    acc[folderId].push(flow);
    return acc;
  }, {});

  const currentFlowFolderId = useMemo(() => {
    if (!currentFlowId || !flowsData.length) return null;

    const currentFlow = flowsData.find((flow) => flow.id === currentFlowId);
    if (!currentFlow) return null;

    return currentFlow.folderId || 'default';
  }, [currentFlowId, flowsData]);

  const sortedFolders =
    folders?.sort((a, b) => a.displayName.localeCompare(b.displayName)) || [];

  const defaultFolderFlows = flowsByFolder['default'] || [];

  const handleFlowClick = (flowId: string) => {
    navigate(
      authenticationSession.appendProjectRoutePrefix(`/flows/${flowId}`),
    );
  };

  const isFlowActive = (flowId: string) => currentFlowId === flowId;

  if (foldersLoading || flowsLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{t('Flows')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarSkeleton numOfItems={6} />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="max-h-[50%] pb-2">
      <SidebarGroupLabel className="flex px-0 pl-2 justify-between items-center w-full mb-1">
        <div className="flex gap-2 items-center justify-start">
          <Workflow className="w-3 h-3 !text-muted-foreground" />
          {t('Folders')}
        </div>
        <PermissionNeededTooltip
          hasPermission={userHasPermissionToUpdateFolders}
        >
          <CreateFolderDialog
            refetchFolders={refetchFolders}
            updateSearchParams={() => {}}
          >
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="size-9">
                  <Plus />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t('New folder')}</TooltipContent>
            </Tooltip>
          </CreateFolderDialog>
        </PermissionNeededTooltip>
      </SidebarGroupLabel>
      <ScrollArea>
        <SidebarGroupContent>
          <SidebarMenu>
            <DefaultFolder
              refetchFlows={refetchFlows}
              flows={defaultFolderFlows}
              onFlowClick={handleFlowClick}
              isFlowActive={isFlowActive}
              shouldBeOpen={currentFlowFolderId === 'default'}
            />

            {sortedFolders.map((folder) => (
              <RegularFolder
                key={folder.id}
                refetchFolders={refetchFolders}
                refetchFlows={refetchFlows}
                folder={folder}
                flows={flowsByFolder[folder.id] || []}
                onFlowClick={handleFlowClick}
                isFlowActive={isFlowActive}
                shouldBeOpen={currentFlowFolderId === folder.id}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </ScrollArea>
    </SidebarGroup>
  );
}

interface FolderProps {
  flows: PopulatedFlow[];
  refetchFlows: () => void;
  onFlowClick: (flowId: string) => void;
  isFlowActive: (flowId: string) => boolean;
  shouldBeOpen: boolean;
}

function DefaultFolder({
  flows,
  onFlowClick,
  isFlowActive,
  refetchFlows,
  shouldBeOpen,
}: FolderProps) {
  return (
    <Collapsible defaultOpen={shouldBeOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="px-2 group/item pr-0">
            <Folder className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <FolderOpen className="w-4 h-4 hidden group-data-[state=open]/collapsible:block" />
            <span>{t('Uncategorized')}</span>
            <div className="ml-auto relative">
              <span className="text-xs w-9 h-9 flex items-center justify-center text-muted-foreground font-semibold absolute group-hover/item:hidden">
                {flows.length}
              </span>

              <CreateFlowDropdown
                folderId="NULL"
                variant="small"
                className="opacity-0 group-hover/item:opacity-100"
              />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {flows.length > 0 && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {flows.map((flow) => (
                <FlowItem
                  key={flow.id}
                  flow={flow}
                  isActive={isFlowActive(flow.id)}
                  onClick={() => onFlowClick(flow.id)}
                  refetch={refetchFlows}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface RegularFolderProps extends FolderProps {
  folder: FolderDto;
  refetchFolders: () => void;
}

function RegularFolder({
  folder,
  flows,
  onFlowClick,
  refetchFlows,
  refetchFolders,
  isFlowActive,
  shouldBeOpen,
}: RegularFolderProps) {
  return (
    <Collapsible
      key={folder.id}
      defaultOpen={shouldBeOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="px-2 pr-0 group/item">
            <Folder className="w-4 h-4 group-data-[state=open]/collapsible:hidden" />
            <FolderOpen className="w-4 h-4 hidden group-data-[state=open]/collapsible:block" />
            <span className="truncate">{folder.displayName}</span>
            <div className="flex items-center justify-center ml-auto">
              <CreateFlowDropdown
                folderId={folder.id}
                variant="small"
                className="group-hover/item:opacity-100 opacity-0"
              />
              <FolderActions refetch={refetchFolders} folder={folder} />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {flows.length > 0 && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {flows.map((flow) => (
                <FlowItem
                  key={flow.id}
                  flow={flow}
                  isActive={isFlowActive(flow.id)}
                  onClick={() => onFlowClick(flow.id)}
                  refetch={refetchFlows}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface FlowItemProps {
  flow: PopulatedFlow;
  isActive: boolean;
  onClick: () => void;
  refetch: () => void;
}

function FlowItem({ flow, isActive, onClick, refetch }: FlowItemProps) {
  const { flowId } = useParams();
  const navigate = useNavigate();

  return (
    <SidebarMenuSubItem className="cursor-pointer group/item">
      <SidebarMenuSubButton
        onClick={onClick}
        className={cn(isActive && 'bg-sidebar-accent', 'pr-0 pl-2')}
      >
        <span className="truncate">{flow.version.displayName}</span>
        <FlowActionMenu
          insideBuilder={false}
          flow={flow}
          readonly={false}
          flowVersion={flow.version}
          onRename={() => {
            refetch();
          }}
          onMoveTo={() => {
            refetch();
          }}
          onDelete={() => {
            if (flowId === flow.id) {
              navigate(
                authenticationSession.appendProjectRoutePrefix('/flows'),
              );
            } else {
              refetch();
            }
          }}
          onDuplicate={() => {
            refetch();
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto group-hover/item:opacity-100 opacity-0"
            onClick={(e) => e.stopPropagation()}
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </FlowActionMenu>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

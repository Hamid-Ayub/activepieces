import { t } from 'i18next';
import {
  SquareFunction,
  Sparkles,
} from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import {
  PropertyExecutionType,
} from '@activepieces/shared';

import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { propertyUtils } from './property-utils';
import { Separator } from '@/components/ui/separator';


type AutoDynamicFieldsProps = {
  allowDynamicValues: boolean;
  propertyName: string;
  property: PieceProperty;
  disabled: boolean;
  inputName: string;
};

const AutoDynamicFields = ({
  allowDynamicValues,
  propertyName,
  inputName,
  property,
  disabled,
}: AutoDynamicFieldsProps) => {
  const form = useFormContext();
  const inputMode =
    form.getValues().settings?.propertySettings?.[propertyName]?.type;
  const isDynamicMode = inputMode === PropertyExecutionType.DYNAMIC;
  const isAutoMode = inputMode === PropertyExecutionType.AUTO;
  const isAuthProperty = property.type === PropertyType.OAUTH2 || property.type === PropertyType.CUSTOM_AUTH || property.type === PropertyType.BASIC_AUTH;

  if (isAuthProperty) {
    return null;
  }

  return (
        <div className="flex items-center gap-3">
        <Separator orientation="vertical" className='h-6'/>
        {allowDynamicValues && (
            <Tooltip>
                <TooltipTrigger asChild>
                <Toggle
                    pressed={isDynamicMode}
                    onPressedChange={(e) => {
                    const newMode = e
                        ? PropertyExecutionType.DYNAMIC
                        : PropertyExecutionType.MANUAL;
                    propertyUtils.handleDynamicValueToggleChange(
                        form,
                        newMode,
                        propertyName,
                        inputName,
                    );
                    }}
                    disabled={disabled}
                    className='p-0 hover:bg-transparent'
                >
                    <SquareFunction
                    className={cn('size-4', {
                        'text-foreground': isDynamicMode,
                        'text-muted-foreground': !isDynamicMode,
                    })}
                    />
                </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-background">
                {t('Dynamic value')}
                </TooltipContent>
            </Tooltip>
        )}
        <Tooltip>
            <TooltipTrigger asChild>
            <Toggle
                pressed={isAutoMode}
                onPressedChange={(e) => {
                const newMode = e
                    ? PropertyExecutionType.AUTO
                    : isDynamicMode
                    ? PropertyExecutionType.DYNAMIC
                    : PropertyExecutionType.MANUAL;
                propertyUtils.handleDynamicValueToggleChange(
                    form,
                    newMode,
                    propertyName,
                    inputName,
                );
                }}
                disabled={disabled}
                className='p-0 hover:bg-transparent'
            >
                <Sparkles
                className={cn('size-4', {
                    'text-primary': isAutoMode,
                    'text-muted-foreground': !isAutoMode,
                })}
                />
            </Toggle>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-background">
            {t('Auto filled by AI')}
            </TooltipContent>
        </Tooltip>
        </div>
    );
};

AutoDynamicFields.displayName = 'AutoDynamicFields';

export { AutoDynamicFields };

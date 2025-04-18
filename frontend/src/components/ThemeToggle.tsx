import React from 'react';
import { Box, RadioGroup, Radio, FormControl, FormControlLabel } from '@mui/material';

interface ThemeToggleProps {
    mode: 'light' | 'dark' | 'system';
    setMode: (mode: 'light' | 'dark' | 'system') => void;
}

export function ThemeToggle({ mode, setMode }: ThemeToggleProps) {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 1000,
                bgcolor: 'background.paper',
                borderRadius: 1,
                p: 1,
                boxShadow: 1,
            }}
        >
            <FormControl size="small">
                <RadioGroup
                    row
                    value={mode}
                    onChange={(event) => setMode(event.target.value as 'light' | 'dark' | 'system')}
                >
                    <FormControlLabel value="system" control={<Radio size="small" />} label="System" />
                    <FormControlLabel value="light" control={<Radio size="small" />} label="Hell" />
                    <FormControlLabel value="dark" control={<Radio size="small" />} label="Dunkel" />
                </RadioGroup>
            </FormControl>
        </Box>
    );
} 
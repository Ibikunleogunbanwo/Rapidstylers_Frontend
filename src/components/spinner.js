import * as React from'react';
import { Backdrop } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
const Spinner = ({loading}) => {
    return ( 
        <div>
            <Backdrop sx={{ color: '#9381FF', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}>
                <CircularProgress color ="inherit"/>
            </Backdrop>
        </div>
     );
}
 
export default Spinner;
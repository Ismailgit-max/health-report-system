import { Navigate } from 'react-router-dom'



function ProtectedRoute({ children, allowedRole }) {



    const storedUser = localStorage.getItem('user')



    // User is not logged in

    if (!storedUser) {

        return <Navigate to="/" replace />

    }



    let user



    try {

        user = JSON.parse(storedUser)

    } catch (error) {

        localStorage.removeItem('user')

        return <Navigate to="/" replace />

    }



    // Invalid login data

    if (!user?.token || !user?.role) {

        localStorage.removeItem('user')

        return <Navigate to="/" replace />

    }



    // Role doesn't match

    if (allowedRole && user.role !== allowedRole) {

        return <Navigate to="/" replace />

    }



    return children

}



export default ProtectedRoute
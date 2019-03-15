import { ready } from './ready.mjs'
import { Auth } from './auth.mjs'
import { AUTH_ISSUER, AUTH_CLIENT_ID, API_PORT } from '../common/config.mjs'

async function main() {

    const auth = new Auth({
        issuer: AUTH_ISSUER,
        clientId: AUTH_CLIENT_ID,
        scopes: ['openid', 'partner', 'department']
    })

    const userAction = document.getElementById('user-action')
    const userResult = document.getElementById('user-result')

    userAction.addEventListener('click', auth.logout)

    if (auth.user) {
        userAction.innerText = 'Logout'
        userAction.href = auth.getLogoutUrl()
        userResult.innerText = JSON.stringify(auth.user, undefined, 4)
    } else {
        userAction.innerText = 'Login'
        userAction.href = auth.getLoginUrl()
    }

    const apiButton = document.getElementById('api-action') 
    const apiResult = document.getElementById('api-result')
    
    apiButton.addEventListener('click', async () => {
        apiButton.disabled = true
        let json
        try {
            const response = await fetch(`http://localhost:${API_PORT}/api`, {
                headers: {
                    Authorization: `Bearer ${auth.accessToken}`
                }
            })
            json = await response.json()
        } 
        
        catch(err) {
            console.error(err)
        }
        apiResult.innerText = JSON.stringify(json, undefined, 4)
        apiButton.disabled = false
    })
}

ready().then(main)
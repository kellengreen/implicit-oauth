export class Auth {
    /**
     * Base authentication class.
     */
    constructor({ 
        issuer,
        clientId,
        scopes = ['openid'],
        redirectUri = `${window.location.origin}/`
    } = {}) {
        this.issuer = issuer
        this.clientId = clientId
        this.scopes = scopes
        this.redirectUri = redirectUri

        this.state = ''
        this.accessToken = ''
        this.idToken = ''
        this.user = null

        this.setTokens()

        // Timeout ID's
        this.timeoutTokenExpired = 0
        this.timeoutTokenExpireSoon = 0
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.tabLostFocus()
            } else {
                this.tabRegainedFocus()
            }
        })
    }

     /**
      * 
      */
    logout() {
        this.user = null
        this.accessToken = ''
        this.idToken =  ''
        localStorage.removeItem('TOKENS')
    }


    /**
     * 
     */
    tabRegainedFocus() {

    }

    /**
     * 
     */
    tabLostFocus() {

    }

    /**
     *
     */
    tokensAreSoonToExpire() {

    }

    /**
     *
     */
    tokensAreSoonToExpire() {

    }

    /**
     * Sets tokens from various sources.
     * @returns {undefined}
     */
    setTokens() {

        // State Token
        this.state = sessionStorage.getItem('STATE') || ''
        if (this.state === '') {
            this.state = this.pRandStr()
            sessionStorage.setItem('STATE', this.state)
        }

        // Authentication tokens
        let didSet = false
        try {
            didSet = this.setTokensFromUrl()
        } catch(err) {
            console.error(err)
        }

        if (didSet) {
            return
        }

        try {
            didSet = this.setTokensFromStorage()
        } catch(err) {
            console.error(err)
        }

    }

    /**
     * Sets authentication tokens from storage.
     * @returns {boolean}
     */
    setTokensFromStorage() {
        const [accessToken = '', idToken = ''] = (localStorage.getItem('TOKENS') || '').split(',', 2)

        if (accessToken === '' || idToken === '') {
            return false
        } 

        this.user = this.parseJwt(accessToken)
        this.accessToken = accessToken
        this.idToken = idToken

        return true
    }

    /**
     * Sets authentication tokens from the URL.
     * @returns {boolean}
     */
    setTokensFromUrl() {
        const params = this.queryToObj(window.location.hash.substr(1))

        if (Object.keys(params).length === 0) {
            return false
        }

        window.location.hash = ''

        const {
            error: errType = '',
            error_description: errMsg = 'Unknown.',
            state: state = '',
            access_token: accessToken = '',
            id_token: idToken = '',
        } = params

        if (errType !== '') {
            throw Error(`${errType}: ${decodeURIComponent(errMsg.replace(/\+/g, '%20'))}`)
        }

        if (state !== this.state) {
            throw Error('State token mismatch while parsing URL hash.')
        }

        if (accessToken === '') {
            throw Error('Did not find access_token while parsing URL hash.')
        }

        if (idToken === '') {
            throw Error('Did not find id_token while parsing URL hash.')
        }

        this.user = this.parseJwt(accessToken)
        this.accessToken = accessToken
        this.idToken = idToken
        localStorage.setItem('TOKENS', `${accessToken},${idToken}`)
        
        return true
    }

    /**
     * 
     */
    refreshTokens() {
        return new Promise((resolve, reject) => {
            fetch(this.getRefreshUrl())
                .then(result => {
                    console.log('S')
                    console.dir(result)
                    resolve()
                })
                .catch(err => {
                    console.log('E')
                    console.dir(err)
                    reject()
                })
        })
    }

    /**************************
     * URL GENERATION METHODS *
     **************************/
    
    /**
     * Generates a URL to refresh tokens.
     * @returns {string}
     */
    getLoginUrl({ prompt = '' } = {}) {
        const params = {
            client_id: this.clientId,
            response_type: 'token id_token',
            scope: this.scopes.join(' '),
            redirect_uri: this.redirectUri,
            state: this.state,
            nonce: this.pRandStr(),
            prompt,
        }
        return `${this.issuer}/v1/authorize?${this.objToQuery(params)}`
    }

    /**
     * Generates a URL to refresh tokens.
     * @returns {string}
     */
    getRefreshUrl() {
        return this.getLoginUrl({ prompt: 'none'})
    }
    
    /**
     * Generates a logout URL.
    * @returns {string}
     */
    getLogoutUrl() {
        const params = {
            id_token_hint: this.idToken,
            post_logout_redirect_uri: this.redirectUri,
        }
        return `${this.issuer}/v1/logout?${this.objToQuery(params)}`
    }

    /**
     * Turns a query string into an object. Empty strings are not permitted.
     * @param {string} str 
     * @returns {object}
     */
    queryToObj(str) {
        const obj = {}
        const params = str.split('&')
        for (const param of params) {
            const [key, val] = param.split('=')
            if (key && val) {
                obj[decodeURIComponent(key)] = decodeURIComponent(val)
            }
        }
        return obj
    }

    /**
     * Turns an object into an URL query string.
     * @param {object} obj 
     * @returns {string}
     */
    objToQuery(obj) {
        const array = []
        for (const [key, val] of Object.entries(obj)) {
            if (key && val) {
                array.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
            }
        }
        return array.join('&')
    }

    /**
     * Parse a JWT string into an object.
     * @param {string} jwt
     * @returns {object}
     */
    parseJwt(jwt) {
        const b64 = jwt.split('.')[1]
        const str = atob(b64)
        return JSON.parse(str)
    }

    /**
     * Generates a pseudo random string.
     * @returns {string}
     */
    pRandStr() {
        return Math.random().toString(36).substr(2)
    }
}

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

        // In memory tokens since Storage is slow.
        this._state = ''
        this._accessToken = ''
        this._accessTokenParsed = null
        this._accessTokenExpiration = 0
        this._idToken =  ''
        this._stateToken = ''

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
     * Gets the current state from storage. Creates a new one if necessary.
     * @returns {string}
     */
    getStateToken() {
        let token = this._state
        if (token === '') {
            token = sessionStorage.getItem('ST') || ''
            if (token === '') {
                token = this.pRandStr()
                sessionStorage.setItem('ST', token)
            }
        }
        return token
    }

    /**
     * Returns a access_token from one of many sources.
     * @returns {string}
     */
    getAccessToken() {
        this.setTokens()
        return this._accessToken
    }

    /**
     * Returns a parsed access_token from one of many sources.
     * @returns {object|null}
     */
    getAccessTokenParsed() {
        this.setTokens()
        return this._accessTokenParsed
    }

    /**
     * Returns the id_token from one of many sources.
     * @returns {string}
     */
    getIdToken() {
        this.setTokens()
        return this._idToken
    }
    
     /**
      * 
      */
    logout() {
        this._accessToken = ''
        this._idToken =  ''
        this._user = null
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
     * Set
     * @returns {undefined}
     */
    setTokens() {
        // Use in memory variables.
        let accessToken = this._accessToken
        let accessTokenParsed = this._accessTokenParsed
        let idToken = this._idToken

        if (accessToken !== '' || accessTokenParsed !== null || idToken !== '') {
            return
        }

        // 
            
            try {
                [accessToken, idToken] = this.getTokensFromUrl()
            } catch(err) {
                console.error(err)
            }
    
            try {
                accessTokenParsed = this.parseJwt(accessToken)
            } catch(err) {
                console.error(err)
            }
            
            [accessToken, idToken] = this.getTokensFromStorage()
            
            this._accessToken = accessToken
            this._accessTokenParsed = accessTokenParsed
            this._idToken = idToken
        }
    }

    /**
     * Retrieves user tokens storage.
     * @returns {string[]}
     */
    getTokensFromMemory() {
        return [this._accessToken, this._idToken]
    }


    /**
     * Retrieves user tokens storage.
     * @returns {string[]}
     */
    getTokensFromStorage() {
        return [localStorage.getItem('AT') || '', localStorage.getItem('IT') || '']
    }

    /**
     * Parses tokens from the URL hash.
     * @returns {string[]}
     */
    getTokensFromUrl() {

        const params = this.queryToObj(window.location.hash.substr(1))

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

        if (state !== this.getStateToken()) {
            throw Error('State token mismatch while parsing URL hash.')
        }

        return [accessToken, idToken]
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
            state: this.getStateToken(),
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
